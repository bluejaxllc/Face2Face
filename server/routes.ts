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

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // User authentication routes
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const user = await storage.createUser(userData);
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Don't return the password in the response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  apiRouter.post("/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "No active session" });
    }
  });
  
  apiRouter.get("/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user information" });
    }
  });
  
  // User profile routes
  apiRouter.patch("/users/profile", async (req: Request, res: Response) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const updates = updateUserSchema.partial().parse(req.body);
      
      const updatedUser = await storage.updateUser(req.session.userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
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
        latitude: location.latitude,
        longitude: location.longitude,
        lastLocation: new Date(),
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
      
      const radius = Number(req.query.radius) || 50; // Default to 50 miles
      const category = req.query.category as string | undefined;
      const datingPreference = req.query.datingPreference as string | undefined;
      
      const nearbyUsers = await storage.getNearbyUsers(
        user.latitude as unknown as number,
        user.longitude as unknown as number,
        radius,
        user.id,
        {
          category,
          datingPreference,
        }
      );
      
      // Don't return sensitive information about other users
      const sanitizedUsers = nearbyUsers.map(({ password, email, ...rest }) => rest);
      
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
      
      // Create the bump
      const bump = await storage.createBump({
        userId,
        bumpedUserId,
      });
      
      // Create a notification for the bumped user
      await storage.createNotification({
        userId: bumpedUserId,
        type: "bump",
        relatedId: bump.id,
        content: `You've been bumped by ${user.username}!`,
      });
      
      res.status(201).json(bump);
    } catch (error) {
      res.status(500).json({ message: "Failed to create bump" });
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
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ message: "receiverId and content are required" });
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

  // Use the API router with prefix
  app.use("/api", apiRouter);

  const httpServer = createServer(app);

  return httpServer;
}
