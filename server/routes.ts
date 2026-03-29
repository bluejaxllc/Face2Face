import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  updateUserSchema,
  insertBumpSchema,
  insertMessageSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { sendVerificationSMS } from "./ghl";

/** Strip HTML tags and trim to maxLength */
function sanitizeInput(input: string, maxLength: number): string {
  return input
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();

  // Setup authentication routes (/api/auth/...)
  await setupAuth(app);

  // User profile routes
  apiRouter.patch("/users/profile", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const raw = updateUserSchema.partial().parse(req.body);
      const updates = {
        ...raw,
        ...(raw.bio !== undefined ? { bio: sanitizeInput(raw.bio ?? "", 500) } : {}),
      };

      const updatedUser = await storage.updateUser(req.session.userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return the password in the response
      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        ...userWithoutPassword,
        profilePhoto: updatedUser.profilePhoto ? `/api/users/${updatedUser.id}/photo` : null
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Location update route
  apiRouter.post("/users/location", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const locationSchema = z.object({
        latitude: z.number(),
        longitude: z.number(),
      });

      const location = locationSchema.parse(req.body);

      const updatedUser = await storage.updateUser(req.session.userId, {
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "Location updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Get specific user by ID
  apiRouter.get("/users/:id", async (req: Request, res: Response, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const idStr = req.params.id;
      // Let dedicated routes handle these paths
      if (idStr === "profile" || idStr === "location" || idStr === "nearby") {
        return next();
      }

      const userId = parseInt(idStr);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return sensitive information
      const { password, email, phoneNumber, ...safeUser } = user;
      res.status(200).json({
        ...safeUser,
        profilePhoto: safeUser.profilePhoto ? `/api/users/${safeUser.id}/photo` : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user details" });
    }
  });

  // Serve user profile photo as a cacheable binary image
  apiRouter.get("/users/:id/photo", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }

      const user = await storage.getUser(userId);

      if (!user || !user.profilePhoto) {
        return res.status(404).send("Photo not found");
      }

      const matches = user.profilePhoto.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        res.set("Content-Type", mimeType);
        res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
        return res.send(buffer);
      } else {
        return res.status(400).send("Invalid photo format");
      }
    } catch (error) {
      res.status(500).send("Failed to load photo");
    }
  });

  // Nearby users route
  apiRouter.get("/users/nearby", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.latitude || !user.longitude) {
        return res.status(400).json({ message: "User location not available" });
      }

      const radius = Number(req.query.radius) || 25000; // Default to unlimited (worldwide)
      const category = req.query.category as string | undefined;
      const queryDatingPreference = req.query.datingPreference as string | undefined;
      const datingPreference = queryDatingPreference || user.datingPreference || undefined;
      const userGender = user.gender || undefined;

      const nearbyUsers = await storage.getNearbyUsers(
        Number(user.latitude),
        Number(user.longitude),
        radius,
        user.id,
        {
          category,
          datingPreference,
          userGender
        }
      );

      // Don't return sensitive information about other users
      const sanitizedUsers = nearbyUsers.map(({ password, email, phoneNumber, ...rest }) => ({
        ...rest,
        profilePhoto: rest.profilePhoto ? `/api/users/${rest.id}/photo` : null
      }));

      res.status(200).json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get nearby users" });
    }
  });

  // Bump routes
  apiRouter.post("/bumps", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.session.userId;
      const { bumpedUserId } = req.body;

      if (!bumpedUserId) {
        return res.status(400).json({ message: "bumpedUserId is required" });
      }

      // Check if the bumped user exists
      const bumpedUser = await storage.getUser(bumpedUserId);
      if (!bumpedUser) {
        return res.status(404).json({ message: "Bumped user not found" });
      }

      // Check if they're within 3 miles of each other
      const user = await storage.getUser(userId);
      if (!user || !user.latitude || !user.longitude || !bumpedUser.latitude || !bumpedUser.longitude) {
        return res.status(400).json({ message: "Location data missing" });
      }

      // In a real app, calculate actual distance here
      // For MVP, we'll simulate the distance check (assume they're close enough)

      // Prevent duplicate bumps (race condition / spam guard)
      const existingBumps = await storage.getBumpsBetweenUsers(userId, bumpedUserId);
      const isAlreadyBumped = existingBumps.some(b => b.userId === userId);
      if (isAlreadyBumped) {
        return res.status(400).json({ message: "You have already bumped this user" });
      }

      // Create the bump
      const bump = await storage.createBump({
        userId,
        bumpedUserId,
      });

      // Create a notification for the bumped user
      await storage.createNotification({
        userId: bumpedUserId,
        type: "bump",
        relatedId: userId, // Pass sender ID so receiver can easily bump back
        content: `You've connected with ${user.firstName}!`,
      });

      res.status(201).json(bump);
    } catch (error) {
      res.status(500).json({ message: "Failed to create bump" });
    }
  });

  // Get all users the current user has bumped with (for message contacts)
  // IMPORTANT: This MUST be before /bumps/:userId to avoid param collision
  apiRouter.get("/bumps/users", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.session.userId;
      const allBumps = await storage.getBumpsByUser(userId);

      // Get unique user IDs from bumps (the other person)
      const uniqueUserIds = new Set<number>();
      allBumps.forEach(bump => {
        if (bump.userId === userId) {
          uniqueUserIds.add(bump.bumpedUserId);
        } else {
          uniqueUserIds.add(bump.userId);
        }
      });

      // Fetch user info + last message for each bumped user
      const bumpedUsers = await Promise.all(
        Array.from(uniqueUserIds).map(async (id) => {
          const user = await storage.getUser(id);
          if (user) {
            const messages = await storage.getMessagesBetweenUsers(userId, id);
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            const unreadCount = messages.filter(m => m.receiverId === userId && !m.read).length;
            return {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePhoto: user.profilePhoto ? `/api/users/${user.id}/photo` : null,
              lastMessage: lastMessage ? { content: lastMessage.content, timestamp: lastMessage.timestamp, senderId: lastMessage.senderId } : null,
              unreadCount,
            };
          }
          return null;
        })
      );

      // Sort by most recent message first
      const sorted = bumpedUsers.filter(Boolean).sort((a: any, b: any) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      });

      res.status(200).json(sorted);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bumped users" });
    }
  });

  apiRouter.get("/bumps/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const currentUserId = req.session.userId;
      const otherUserId = parseInt(req.params.userId);

      const bumps = await storage.getBumpsBetweenUsers(currentUserId, otherUserId);

      res.status(200).json(bumps);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bumps" });
    }
  });

  // Message routes
  apiRouter.post("/messages", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const senderId = req.session.userId;
      const { receiverId, content: rawContent } = req.body;

      if (!receiverId || !rawContent) {
        return res.status(400).json({ message: "receiverId and content are required" });
      }

      const content = sanitizeInput(String(rawContent), 2000);
      if (content.length === 0) {
        return res.status(400).json({ message: "Message content cannot be empty" });
      }

      // Check if the receiver exists
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      // Check if they've bumped before (required to message)
      const bumps = await storage.getBumpsBetweenUsers(senderId, receiverId);
      if (bumps.length === 0) {
        return res.status(403).json({ message: "You need to bump into this user before messaging" });
      }

      // Create the message
      const message = await storage.createMessage({
        senderId,
        receiverId,
        content,
      });

      // Create a notification for the receiver
      const sender = await storage.getUser(senderId);
      await storage.createNotification({
        userId: receiverId,
        type: "message",
        relatedId: message.id,
        content: `${sender?.username} sent you a message`,
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  apiRouter.get("/messages/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const currentUserId = req.session.userId;
      const otherUserId = parseInt(req.params.userId);

      // First check if they've bumped (required to view messages)
      const bumps = await storage.getBumpsBetweenUsers(currentUserId, otherUserId);
      if (bumps.length === 0) {
        return res.status(403).json({ message: "You need to bump into this user to see messages" });
      }

      const messages = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);

      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // Notification routes
  apiRouter.get("/notifications", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const notifications = await storage.getNotificationsByUser(req.session.userId);

      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  apiRouter.post("/notifications/read/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const notificationId = parseInt(req.params.id);

      await storage.markNotificationAsRead(notificationId);

      res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  apiRouter.post("/notifications/read-all", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await storage.markAllNotificationsAsRead(req.session.userId);

      res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // ---- Phone Verification Routes ----

  // Send verification code
  apiRouter.post("/verify/send", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, firstName } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      // Normalize phone number (ensure +1 prefix)
      const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`;

      // Rate limit: max 3 codes per phone per 15 minutes
      const recentCount = await storage.getRecentCodeCount(normalizedPhone, 15);
      if (recentCount >= 3) {
        return res.status(429).json({ message: "Too many verification attempts. Please wait 15 minutes." });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store in DB
      await storage.createVerificationCode(normalizedPhone, code, expiresAt);

      // Send via GHL SMS
      const sent = await sendVerificationSMS(normalizedPhone, code, firstName || "User");

      if (!sent) {
        return res.status(500).json({ message: "Failed to send verification code. Please try again." });
      }

      res.status(200).json({ message: "Verification code sent", phone: normalizedPhone });
    } catch (error) {
      console.error("Verify send error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Check verification code
  apiRouter.post("/verify/check", async (req: Request, res: Response) => {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and code are required" });
      }

      const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`;

      // Find valid code
      const verification = await storage.getValidVerificationCode(normalizedPhone, code);

      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }

      // Mark code as used
      await storage.markVerificationCodeUsed(verification.id);

      // If user is logged in, mark their phone as verified
      if (req.session?.userId) {
        await storage.updateUser(req.session.userId, {
          phoneNumber: normalizedPhone,
          isPhoneVerified: true,
        });
      }

      res.status(200).json({ message: "Phone verified successfully", verified: true });
    } catch (error) {
      console.error("Verify check error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Use the API router with prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
