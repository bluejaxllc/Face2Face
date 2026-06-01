import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  updateUserSchema,
  insertBumpSchema,
  insertNotificationSchema,
  insertWaitlistSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { sendVerificationSMS } from "./ghl";
import { validateTags, validateModeration } from "@shared/moderation";
import { uploadImageFromBase64 } from "./lib/storage-client";
import { notifyUser } from "./websocket";

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

  apiRouter.patch("/users/profile", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const raw = updateUserSchema.partial().parse(req.body);

      // Determine active category and fields for tag validation
      const activeCategory = raw.category !== undefined ? raw.category : (user.category || "friendships");
      const activeInterests = raw.interests !== undefined ? raw.interests : user.interests;
      const activeSeeking = raw.seeking !== undefined ? raw.seeking : user.seeking;
      const activeSkills = raw.skills !== undefined ? raw.skills : user.skills;

      // Validate category tag isolation
      if (activeCategory) {
        const tagValidation = validateTags(activeCategory, activeInterests, activeSeeking, activeSkills);
        if (!tagValidation.isValid) {
          return res.status(400).json({ message: tagValidation.error });
        }
      }

      // Moderate friendship-related fields
      if (activeCategory === "friendships") {
        const fieldsToModerate = {
          bio: raw.bio !== undefined ? raw.bio : user.bio,
          currentActivity: raw.currentActivity !== undefined ? raw.currentActivity : user.currentActivity,
          vibeStatus: raw.vibeStatus !== undefined ? raw.vibeStatus : user.vibeStatus,
          interests: activeInterests,
          seeking: activeSeeking,
          icebreaker: raw.icebreaker !== undefined ? raw.icebreaker : user.icebreaker,
        };

        const modValidation = validateModeration(fieldsToModerate);
        if (!modValidation.isValid) {
          return res.status(400).json({
            message: `Appropriate content required. Offensive language detected in ${modValidation.field}: "${modValidation.blockedWord}" is not allowed on friendship profiles.`
          });
        }
      }

      const updates: Record<string, any> = {
        ...raw,
        ...(raw.bio !== undefined ? { bio: sanitizeInput(raw.bio ?? "", 500) } : {}),
      };

      // Handle image uploads to persistent volume
      if (raw.profilePhoto && raw.profilePhoto.startsWith('data:image')) {
        updates.profilePhoto = await uploadImageFromBase64(raw.profilePhoto, req.session.userId, 'profile');
      }
      if (raw.bannerPhoto && raw.bannerPhoto.startsWith('data:image')) {
        updates.bannerPhoto = await uploadImageFromBase64(raw.bannerPhoto, req.session.userId, 'banner');
      }

      const updatedUser = await storage.updateUser(req.session.userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return the password in the response
      const { password, ...userWithoutPassword } = updatedUser;

      res.status(200).json({
        ...userWithoutPassword,
        profilePhoto: updatedUser.profilePhoto?.startsWith('/uploads/') 
          ? updatedUser.profilePhoto 
          : (updatedUser.profilePhoto ? `/api/users/${updatedUser.id}/photo` : null)
      });
    } catch (error) {
      const err = error as any;
      console.error("Profile update error:", err);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile", err: err.message, stack: err.stack });
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

  // Waitlist route
  apiRouter.post("/waitlist", async (req: Request, res: Response) => {
    try {
      const raw = insertWaitlistSchema.parse(req.body);
      const waitlist = await storage.createWaitlist(raw);
      res.status(201).json(waitlist);
    } catch (error) {
      console.error("Waitlist error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to join waitlist" });
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
        profilePhoto: safeUser.profilePhoto?.startsWith('/uploads/') 
          ? safeUser.profilePhoto 
          : (safeUser.profilePhoto ? `/api/users/${safeUser.id}/photo` : null)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user details" });
    }
  });

  // Served user profile photo as a cacheable binary image
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

      if (user.profilePhoto.startsWith('/uploads/')) {
        return res.redirect(user.profilePhoto);
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
      const userSex = user.sex || undefined;

      const nearbyUsers = await storage.getNearbyUsers(
        Number(user.latitude),
        Number(user.longitude),
        radius,
        user.id,
        {
          category,
          datingPreference,
          userSex
        }
      );

      // Filter out blocked users (bidirectional: I blocked them OR they blocked me)
      const myBlockedIds = await storage.getBlockedUsers(req.session.userId);
      const filteredUsers = [];
      for (const u of nearbyUsers) {
        if (myBlockedIds.includes(u.id)) continue;
        const theyBlockedMe = await storage.isBlocked(u.id, req.session.userId);
        if (theyBlockedMe) continue;
        filteredUsers.push(u);
      }

      // Don't return sensitive information about other users
      const sanitizedUsers = filteredUsers.map(({ password, email, phoneNumber, ...rest }) => ({
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
        message: req.body.message || null,
      });

      // Automatically send the "bumpMessage" as the first chat message to bridge the gap
      // This is crucial so that when they go to the Messages tab, a conversation is already initiated
      const bumpMessageContent = req.body.message || user.bumpMessage || "Hey! I just bumped you \u2728";
      const initialMessage = await storage.createMessage({
        senderId: userId,
        receiverId: bumpedUserId,
        content: bumpMessageContent
      });

      // Create a notification for the bumped user
      const notification = await storage.createNotification({
        userId: bumpedUserId,
        type: "bump",
        relatedId: userId, // Pass sender ID so receiver can easily bump back
        content: `${user.firstName} bumped you!`
      });

      // Notify the receiver about the bump and initial message
      notifyUser(bumpedUserId, 'NEW_BUMP', bump);
      notifyUser(bumpedUserId, 'NEW_MESSAGE', initialMessage);
      notifyUser(bumpedUserId, 'NEW_NOTIFICATION', notification);

      res.status(201).json(bump);
    } catch (error) {
      res.status(500).json({ message: "Failed to create bump" });
    }
  });

  // Get bumps received by the current user (for "Been Bumped" badge)
  // IMPORTANT: This MUST be before /bumps/:userId to avoid param collision
  apiRouter.get("/bumps/received", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.session.userId;
      const allBumps = await storage.getBumpsByUser(userId);
      // Filter to bumps WHERE I am the receiver (bumpedUserId === me)
      const received = allBumps.filter(b => b.bumpedUserId === userId && b.status === 'pending');
      // Enrich with sender info
      const enriched = await Promise.all(
        received.map(async (bump) => {
          const sender = await storage.getUser(bump.userId);
          return {
            ...bump,
            sender: sender ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              sex: sender.sex,
              age: sender.age,
              selfRating: sender.selfRating,
              category: sender.category,
              profilePhoto: sender.profilePhoto ? `/api/users/${sender.id}/photo` : null,
              latitude: parseFloat(sender.latitude as string),
              longitude: parseFloat(sender.longitude as string),
              favoriteColor: sender.favoriteColor,
              favoriteSong: sender.favoriteSong,
              fieldOfStudy: sender.fieldOfStudy,
              interests: sender.interests,
              seeking: sender.seeking,
            } : null,
          };
        })
      );
      res.status(200).json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to get received bumps" });
    }
  });

  // Respond to a bump (bump_back, ignore, reply_later)
  apiRouter.patch("/bumps/:id/respond", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const bumpId = parseInt(req.params.id);
      const { action } = req.body; // "bump_back", "ignore", "reply_later"
      if (!['bump_back', 'ignore', 'reply_later'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      // Update bump status
      const statusMap: Record<string, string> = {
        bump_back: 'bumping_back',
        ignore: 'rejected',
        reply_later: 'pending',
      };
      await storage.updateBump(bumpId, { status: statusMap[action], seen: true });
      // Notify the original sender
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const bump = await storage.getBump(bumpId);
      if (bump && user) {
        let content = '';
        if (action === 'bump_back') content = `${user.firstName} bumped you back!`;
        else if (action === 'ignore') content = `${user.firstName} isn't interested right now.`;
        else content = `${user.firstName} will reply later.`;
        await storage.createNotification({
          userId: bump.userId,
          type: 'bump',
          relatedId: userId,
          content,
        });
      }
      res.status(200).json({ success: true, action });
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to bump" });
    }
  });

  // Reveal profile — mutual opt-in
  apiRouter.patch("/bumps/:id/reveal", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const bumpId = parseInt(req.params.id);
      const userId = req.session.userId;
      const bump = await storage.getBump(bumpId);
      if (!bump) return res.status(404).json({ message: "Bump not found" });

      // Determine which side is revealing
      const isSender = bump.userId === userId;
      const isReceiver = bump.bumpedUserId === userId;
      if (!isSender && !isReceiver) {
        return res.status(403).json({ message: "Not your bump" });
      }

      // Track reveals with status field:
      //   pending/bumping_back → one side hasn't revealed
      //   "sender_revealed" / "receiver_revealed" → one side revealed
      //   "revealed" → both sides revealed
      let newStatus = bump.status;
      if (bump.status === "revealed") {
        return res.status(200).json({ mutual: true, status: "revealed" });
      }
      if (isSender && bump.status === "receiver_revealed") newStatus = "revealed";
      else if (isReceiver && bump.status === "sender_revealed") newStatus = "revealed";
      else if (isSender) newStatus = "sender_revealed";
      else newStatus = "receiver_revealed";

      await storage.updateBump(bumpId, { status: newStatus });

      const mutual = newStatus === "revealed";
      const user = await storage.getUser(userId);

      // Notify the other party
      const otherId = isSender ? bump.bumpedUserId : bump.userId;
      if (user) {
        await storage.createNotification({
          userId: otherId,
          type: "bump",
          relatedId: userId,
          content: mutual
            ? `${user.firstName} also revealed their profile! You can now see each other's full profiles.`
            : `${user.firstName} wants to reveal profiles. Reveal yours to unlock full access!`,
        });
      }

      // If mutual, trigger heartbeat haptic hint (client will handle)
      res.status(200).json({ mutual, status: newStatus });
    } catch (error) {
      res.status(500).json({ message: "Failed to reveal profile" });
    }
  });


  apiRouter.get("/bumps/users", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const connectedUsers = await storage.getConnectedUsers(req.session.userId);

      const usersWithDetails = await Promise.all(connectedUsers.map(async (u) => {
        const msgs = await storage.getMessagesBetweenUsers(req.session!.userId!, u.id);
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const unreadCount = await storage.getUnreadMessageCount(req.session!.userId!, u.id);

        const bumps = await storage.getBumpsBetweenUsers(req.session!.userId!, u.id);
        const hasPendingReceivedBump = bumps.some(b => b.bumpedUserId === req.session!.userId! && b.status === "pending");

        return {
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          profilePhoto: u.profilePhoto,
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            timestamp: lastMsg.timestamp,
            senderId: lastMsg.senderId
          } : null,
          unreadCount,
          hasPendingReceivedBump
        };
      }));

      usersWithDetails.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp!).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp!).getTime() : 0;
        return timeB - timeA;
      });

      res.status(200).json(usersWithDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to get users" });
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

  apiRouter.get("/messages/:userId", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const otherUserId = parseInt(req.params.userId);

      // Check if either user has blocked the other
      const iBlockedThem = await storage.isBlocked(req.session.userId, otherUserId);
      const theyBlockedMe = await storage.isBlocked(otherUserId, req.session.userId);
      if (iBlockedThem || theyBlockedMe) {
        return res.status(403).json({ message: "Cannot view messages with this user" });
      }

      const messages = await storage.getMessagesBetweenUsers(req.session.userId, otherUserId);
      await storage.markMessagesAsRead(req.session.userId, otherUserId);

      res.status(200).json(messages);
    } catch (error) {
      console.error("Failed to get messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  apiRouter.post("/messages", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { receiverId, content } = req.body;
      if (!receiverId || !content) {
        return res.status(400).json({ message: "Missing receiverId or content" });
      }

      const targetId = parseInt(receiverId);

      // Check if either user has blocked the other
      const iBlockedThem = await storage.isBlocked(req.session.userId, targetId);
      const theyBlockedMe = await storage.isBlocked(targetId, req.session.userId);
      if (iBlockedThem || theyBlockedMe) {
        return res.status(403).json({ message: "Cannot send messages to this user" });
      }

      const message = await storage.createMessage({
        senderId: req.session.userId,
        receiverId: targetId,
        content
      });

      const sender = await storage.getUser(req.session.userId);
      const notification = await storage.createNotification({
        userId: targetId,
        type: "message",
        relatedId: req.session.userId,
        content: `${sender?.firstName} sent you a message`
      });

      // Notify receiver immediately
      notifyUser(targetId, 'NEW_MESSAGE', message);
      notifyUser(targetId, 'NEW_NOTIFICATION', notification);

      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(500).json({ message: "Failed to send message" });
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

  // Dating Events
  apiRouter.post("/dating-events", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const eventData = { ...req.body, userId: req.session.userId };
      const newEvent = await storage.createDatingEvent(eventData);
      
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Create dating event error:", error);
      res.status(500).json({ message: "Failed to create dating event" });
    }
  });

  apiRouter.get("/dating-events", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const params = {
        type: req.query.type as string | undefined,
        location: req.query.location as string | undefined
      };
      
      const events = await storage.getDatingEvents(params);
      res.status(200).json(events);
    } catch (error) {
      console.error("Get dating events error:", error);
      res.status(500).json({ message: "Failed to fetch dating events" });
    }
  });

  // ---- Account Deletion ----
  apiRouter.delete("/users/account", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { confirm } = req.body;
      if (confirm !== true) {
        return res.status(400).json({ message: "You must confirm account deletion by sending { confirm: true }" });
      }

      const userId = req.session.userId;

      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Soft-delete: clear sensitive data, mark inactive
      await storage.deleteAccount(userId);

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error during account deletion:", err);
        }
      });

      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // ---- Block & Report Routes ----

  // Block a user
  apiRouter.post("/users/:id/block", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const blockedId = parseInt(req.params.id);
      if (isNaN(blockedId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (blockedId === req.session.userId) {
        return res.status(400).json({ message: "Cannot block yourself" });
      }

      // Check if already blocked
      const alreadyBlocked = await storage.isBlocked(req.session.userId, blockedId);
      if (alreadyBlocked) {
        return res.status(400).json({ message: "User is already blocked" });
      }

      // Create block record
      const block = await storage.blockUser(req.session.userId, blockedId);

      // Remove any existing bumps and messages between them
      await storage.deleteBumpsBetweenUsers(req.session.userId, blockedId);
      await storage.deleteMessagesBetweenUsers(req.session.userId, blockedId);

      res.status(201).json({ message: "User blocked successfully", block });
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  // Unblock a user
  apiRouter.delete("/users/:id/block", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const blockedId = parseInt(req.params.id);
      if (isNaN(blockedId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      await storage.unblockUser(req.session.userId, blockedId);

      res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Get blocked user IDs
  apiRouter.get("/users/blocked", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const blockedIds = await storage.getBlockedUsers(req.session.userId);

      res.status(200).json(blockedIds);
    } catch (error) {
      console.error("Get blocked users error:", error);
      res.status(500).json({ message: "Failed to get blocked users" });
    }
  });

  // Report a user
  apiRouter.post("/users/:id/report", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const reportedId = parseInt(req.params.id);
      if (isNaN(reportedId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      if (reportedId === req.session.userId) {
        return res.status(400).json({ message: "Cannot report yourself" });
      }

      const { reason, details } = req.body;
      const validReasons = ['harassment', 'fake_profile', 'inappropriate', 'spam', 'underage', 'other'];
      if (!reason || !validReasons.includes(reason)) {
        return res.status(400).json({ message: "Invalid or missing reason. Must be one of: " + validReasons.join(", ") });
      }

      const report = await storage.createReport({
        reporterId: req.session.userId,
        reportedId,
        reason,
        details: details ? sanitizeInput(details, 1000) : undefined,
      });

      res.status(201).json({ message: "Report submitted successfully", report });
    } catch (error) {
      console.error("Report user error:", error);
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // Use the API router with prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
