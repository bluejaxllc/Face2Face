import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phoneNumber: z.string().min(10).max(15).optional(),
  gender: z.string().optional().default("other"),
  age: z.coerce.number().min(18).optional().default(18),
  selfRating: z.coerce.number().min(1).max(10).optional().default(5),
});

// Use type declaration from types/express-session.d.ts

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function setupAuth(app: Express) {
  // User authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = registerSchema.parse(req.body);

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

      // Hash the password
      const hashedPassword = await hashPassword(userData.password);

      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

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
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Compare passwords
      const passwordMatch = await comparePasswords(password, user.password);
      if (!passwordMatch) {
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
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
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

  app.get("/api/auth/me", async (req: Request, res: Response) => {
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
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });
}