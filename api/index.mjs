var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/api.ts
import express2 from "express";
import session2 from "express-session";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  bumps: () => bumps,
  insertBumpSchema: () => insertBumpSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  notifications: () => notifications,
  updateUserSchema: () => updateUserSchema,
  users: () => users,
  verificationCodes: () => verificationCodes
});
import { pgTable, text, serial, integer, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  gender: text("gender").notNull().default("female"),
  // 'male', 'female'
  age: integer("age").notNull().default(18),
  height: text("height"),
  weight: text("weight"),
  selfRating: integer("self_rating").default(5),
  category: text("category").default("friendships"),
  // "dating", "business", "friendships"
  bio: text("bio"),
  datingPreference: text("dating_preference").default("women"),
  // "men", "women"
  favoriteColor: text("favorite_color"),
  favoriteSong: text("favorite_song"),
  fieldOfStudy: text("field_of_study"),
  interests: text("interests"),
  // Comma-separated or JSON string
  seeking: text("seeking"),
  // Comma-separated or JSON string
  bumpMessage: text("bump_message"),
  // Default message when bumping
  isActive: boolean("is_active").default(true),
  inactiveTimeout: integer("inactive_timeout").default(30),
  // minutes
  latitude: numeric("latitude").notNull().default("0"),
  longitude: numeric("longitude").notNull().default("0"),
  lastLocation: timestamp("last_location"),
  profileCompleted: boolean("profile_completed").default(false),
  profilePhoto: text("profile_photo"),
  // base64 encoded photo string
  phoneNumber: text("phone_number").unique(),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  safetyAcknowledged: boolean("safety_acknowledged").default(false)
}, (table) => {
  return {
    usernameIdx: index("username_idx").on(table.username),
    emailIdx: index("email_idx").on(table.email),
    phoneIdx: index("phone_idx").on(table.phoneNumber),
    isActiveIdx: index("is_active_idx").on(table.isActive)
  };
});
var bumps = pgTable("bumps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bumpedUserId: integer("bumped_user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  seen: boolean("seen").default(false),
  status: text("status").default("pending"),
  // "pending", "initiated", "completed" or "rejected", "bumping_back", "revealed"
  message: text("message")
  // Optional message sent with the bump
}, (table) => {
  return {
    userIdIdx: index("bump_user_id_idx").on(table.userId),
    bumpedUserIdIdx: index("bumped_user_id_idx").on(table.bumpedUserId)
  };
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false)
}, (table) => {
  return {
    senderIdIdx: index("message_sender_id_idx").on(table.senderId),
    receiverIdIdx: index("message_receiver_id_idx").on(table.receiverId)
  };
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  // "bump"
  relatedId: integer("related_id"),
  // The ID of the bump or message
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false)
}, (table) => {
  return {
    userIdIdx: index("notification_user_id_idx").on(table.userId)
  };
});
var verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => {
  return {
    phoneCodeIdx: index("phone_code_idx").on(table.phoneNumber, table.code)
  };
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  gender: true,
  age: true,
  selfRating: true,
  datingPreference: true,
  phoneNumber: true
});
var updateUserSchema = createInsertSchema(users).pick({
  height: true,
  weight: true,
  selfRating: true,
  category: true,
  bio: true,
  datingPreference: true,
  favoriteColor: true,
  favoriteSong: true,
  fieldOfStudy: true,
  interests: true,
  seeking: true,
  bumpMessage: true,
  isActive: true,
  inactiveTimeout: true,
  latitude: true,
  longitude: true,
  lastLocation: true,
  profileCompleted: true,
  profilePhoto: true,
  phoneNumber: true,
  isPhoneVerified: true,
  safetyAcknowledged: true
});
var insertBumpSchema = createInsertSchema(bumps).pick({
  userId: true,
  bumpedUserId: true,
  status: true,
  message: true
});
var insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true
});
var insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  relatedId: true,
  content: true
});

// server/storage.ts
import { eq, or, and, desc, asc, sql } from "drizzle-orm";

// server/db.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var client = postgres(process.env.DATABASE_URL);
var db = drizzle(client, { schema: schema_exports });

// server/storage.ts
import session from "express-session";
import connectPg from "connect-pg-simple";

// server/log.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// server/storage.ts
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    });
    log("Database connection established", "storage");
  }
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values({
      ...insertUser
    }).returning();
    return result[0];
  }
  async updateUser(id, updates) {
    const updateData = {
      ...updates,
      ...updates.latitude !== void 0 && updates.longitude !== void 0 ? { lastLocation: /* @__PURE__ */ new Date() } : {}
    };
    const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }
  async getNearbyUsers(latitude, longitude, radius, userId, preferences = {}) {
    const conditions = [
      sql`${users.id} != ${userId}`,
      eq(users.isActive, true),
      sql`${users.latitude} IS NOT NULL`,
      sql`${users.longitude} IS NOT NULL`,
      // Exclude users who still have the default 0,0 coordinates (never set location)
      sql`NOT (CAST(${users.latitude} AS DOUBLE PRECISION) = 0 AND CAST(${users.longitude} AS DOUBLE PRECISION) = 0)`,
      // Only show users who have been active/pinged location in the last 30 minutes
      sql`${users.lastLocation} > NOW() - INTERVAL '30 minutes'`
    ];
    return await db.select().from(users).where(and(...conditions));
  }
  async createBump(insertBump) {
    const result = await db.insert(bumps).values({
      ...insertBump,
      timestamp: /* @__PURE__ */ new Date(),
      seen: false
    }).returning();
    return result[0];
  }
  async getBump(id) {
    const result = await db.select().from(bumps).where(eq(bumps.id, id)).limit(1);
    return result[0];
  }
  async updateBump(id, updates) {
    const result = await db.update(bumps).set(updates).where(eq(bumps.id, id)).returning();
    return result[0];
  }
  async getBumpsBetweenUsers(userId, bumpedUserId) {
    return await db.select().from(bumps).where(or(
      and(
        eq(bumps.userId, userId),
        eq(bumps.bumpedUserId, bumpedUserId)
      ),
      and(
        eq(bumps.userId, bumpedUserId),
        eq(bumps.bumpedUserId, userId)
      )
    )).orderBy(desc(bumps.timestamp));
  }
  async getBumpsByUser(userId) {
    return await db.select().from(bumps).where(or(
      eq(bumps.userId, userId),
      eq(bumps.bumpedUserId, userId)
    )).orderBy(desc(bumps.timestamp));
  }
  async getRecentBumps(userId, limit = 10) {
    return await db.select().from(bumps).where(or(
      eq(bumps.userId, userId),
      eq(bumps.bumpedUserId, userId)
    )).orderBy(desc(bumps.timestamp)).limit(limit);
  }
  // Message Operations
  async createMessage(insertMessage) {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }
  async getMessagesBetweenUsers(userId1, userId2) {
    return await db.select().from(messages).where(or(
      and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
      and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
    )).orderBy(asc(messages.timestamp));
  }
  async getUnreadMessageCount(userId, fromUserId) {
    const conditions = [
      eq(messages.receiverId, userId),
      eq(messages.read, false)
    ];
    if (fromUserId) {
      conditions.push(eq(messages.senderId, fromUserId));
    }
    const result = await db.select({ count: sql`count(*)` }).from(messages).where(and(...conditions));
    return Number(result[0]?.count || 0);
  }
  async markMessagesAsRead(userId, fromUserId) {
    await db.update(messages).set({ read: true }).where(and(
      eq(messages.receiverId, userId),
      eq(messages.senderId, fromUserId),
      eq(messages.read, false)
    ));
  }
  async getConnectedUsers(userId) {
    const userBumps = await db.select().from(bumps).where(or(
      eq(bumps.userId, userId),
      eq(bumps.bumpedUserId, userId)
    ));
    const connectedSet = /* @__PURE__ */ new Set();
    for (const b of userBumps) {
      if (b.userId !== userId) connectedSet.add(b.userId);
      if (b.bumpedUserId !== userId) connectedSet.add(b.bumpedUserId);
    }
    const chatHistory = await db.select().from(messages).where(or(
      eq(messages.senderId, userId),
      eq(messages.receiverId, userId)
    ));
    for (const m of chatHistory) {
      if (m.senderId !== userId) connectedSet.add(m.senderId);
      if (m.receiverId !== userId) connectedSet.add(m.receiverId);
    }
    if (connectedSet.size === 0) return [];
    const userIds = Array.from(connectedSet);
    const { inArray } = await import("drizzle-orm");
    const connectedUsers = await db.select().from(users).where(inArray(users.id, userIds));
    return connectedUsers;
  }
  async createNotification(insertNotification) {
    const result = await db.insert(notifications).values({
      ...insertNotification,
      timestamp: /* @__PURE__ */ new Date(),
      read: false
    }).returning();
    return result[0];
  }
  async getNotificationsByUser(userId) {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.timestamp));
  }
  async getUnreadNotifications(userId) {
    return await db.select().from(notifications).where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    )).orderBy(desc(notifications.timestamp));
  }
  async markNotificationAsRead(id) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
  async markAllNotificationsAsRead(userId) {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }
  // Verification code operations
  async createVerificationCode(phoneNumber, code, expiresAt) {
    const result = await db.insert(verificationCodes).values({
      phoneNumber,
      code,
      expiresAt,
      used: false
    }).returning();
    return result[0];
  }
  async getValidVerificationCode(phoneNumber, code) {
    const result = await db.select().from(verificationCodes).where(and(
      eq(verificationCodes.phoneNumber, phoneNumber),
      eq(verificationCodes.code, code),
      eq(verificationCodes.used, false),
      sql`${verificationCodes.expiresAt} > NOW()`
    )).orderBy(desc(verificationCodes.id)).limit(1);
    return result[0];
  }
  async markVerificationCodeUsed(id) {
    await db.update(verificationCodes).set({ used: true }).where(eq(verificationCodes.id, id));
  }
  async getRecentCodeCount(phoneNumber, sinceMinutes) {
    const result = await db.select({ count: sql`count(*)` }).from(verificationCodes).where(and(
      eq(verificationCodes.phoneNumber, phoneNumber),
      sql`${verificationCodes.createdAt} > NOW() - INTERVAL '${sql.raw(String(sinceMinutes))} minutes'`
    ));
    return result[0]?.count || 0;
  }
  async getUserByPhone(phone) {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phone)).limit(1);
    return result[0];
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";

// server/auth.ts
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { z } from "zod";
var registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phoneNumber: z.string().min(10).max(15).optional(),
  gender: z.string().optional().default("female"),
  age: z.coerce.number().min(18).optional().default(18),
  selfRating: z.coerce.number().min(1).max(10).optional().default(5)
});
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
async function setupAuth(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      const { password, ...userWithoutPassword } = user;
      if (req.session) {
        req.session.userId = user.id;
      }
      res.status(201).json({
        ...userWithoutPassword,
        profilePhoto: user.profilePhoto ? `/api/users/${user.id}/photo` : null
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      const passwordMatch = await comparePasswords(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      if (req.session) {
        req.session.userId = user.id;
      }
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({
        ...userWithoutPassword,
        profilePhoto: user.profilePhoto ? `/api/users/${user.id}/photo` : null
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
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
  app2.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json({
        ...userWithoutPassword,
        profilePhoto: user.profilePhoto ? `/api/users/${user.id}/photo` : null
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  });
}

// server/ghl.ts
var GHL_API_BASE = "https://services.leadconnectorhq.com";
var GHL_API_KEY = process.env.GHL_API_KEY || "";
var GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || "";
var GHL_PHONE_NUMBER = process.env.GHL_PHONE_NUMBER || "";
function getHeaders() {
  return {
    Authorization: `Bearer ${GHL_API_KEY}`,
    "Content-Type": "application/json",
    Version: "2021-07-28"
  };
}
async function findOrCreateContact(phone, firstName) {
  const searchRes = await fetch(
    `${GHL_API_BASE}/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(phone)}&limit=1`,
    { method: "GET", headers: getHeaders() }
  );
  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.contacts && searchData.contacts.length > 0) {
      return searchData.contacts[0].id;
    }
  }
  const createRes = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      phone,
      firstName: firstName || "Face2Face User",
      source: "Face2Face App",
      tags: ["face2face", "sms-verification"]
    })
  });
  if (!createRes.ok) {
    const error = await createRes.text();
    console.error("GHL create contact error:", error);
    throw new Error(`Failed to create GHL contact: ${createRes.status}`);
  }
  const contactData = await createRes.json();
  return contactData.contact.id;
}
async function sendSMS(contactId, message) {
  const res = await fetch(`${GHL_API_BASE}/conversations/messages`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      type: "SMS",
      contactId,
      message
    })
  });
  if (!res.ok) {
    const error = await res.text();
    console.error("GHL send SMS error:", error);
    return false;
  }
  return true;
}
async function sendVerificationSMS(phone, code, firstName) {
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error("GHL credentials not configured. Set GHL_API_KEY and GHL_LOCATION_ID env vars.");
    console.log(`[DEV MODE] Verification code for ${phone}: ${code}`);
    return true;
  }
  try {
    const contactId = await findOrCreateContact(phone, firstName);
    const message = `Your Face2Face verification code is: ${code}

This code expires in 5 minutes. Do not share it with anyone.`;
    return await sendSMS(contactId, message);
  } catch (error) {
    console.error("Failed to send verification SMS:", error);
    return false;
  }
}

// server/routes.ts
function sanitizeInput(input, maxLength) {
  return input.replace(/<[^>]*>/g, "").trim().slice(0, maxLength);
}
async function registerRoutes(app2) {
  const apiRouter = express.Router();
  await setupAuth(app2);
  apiRouter.patch("/users/profile", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const raw = updateUserSchema.partial().parse(req.body);
      const updates = {
        ...raw,
        ...raw.bio !== void 0 ? { bio: sanitizeInput(raw.bio ?? "", 500) } : {}
      };
      const updatedUser = await storage.updateUser(req.session.userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json({
        ...userWithoutPassword,
        profilePhoto: updatedUser.profilePhoto ? `/api/users/${updatedUser.id}/photo` : null
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  apiRouter.post("/users/location", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const locationSchema = z2.object({
        latitude: z2.number(),
        longitude: z2.number()
      });
      const location = locationSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.session.userId, {
        latitude: String(location.latitude),
        longitude: String(location.longitude)
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "Location updated successfully" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update location" });
    }
  });
  apiRouter.get("/users/:id", async (req, res, next) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const idStr = req.params.id;
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
      const { password, email, phoneNumber, ...safeUser } = user;
      res.status(200).json({
        ...safeUser,
        profilePhoto: safeUser.profilePhoto ? `/api/users/${safeUser.id}/photo` : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user details" });
    }
  });
  apiRouter.get("/users/:id/photo", async (req, res) => {
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
        res.set("Cache-Control", "public, max-age=86400");
        return res.send(buffer);
      } else {
        return res.status(400).send("Invalid photo format");
      }
    } catch (error) {
      res.status(500).send("Failed to load photo");
    }
  });
  apiRouter.get("/users/nearby", async (req, res) => {
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
      const radius = Number(req.query.radius) || 25e3;
      const category = req.query.category;
      const queryDatingPreference = req.query.datingPreference;
      const datingPreference = queryDatingPreference || user.datingPreference || void 0;
      const userGender = user.gender || void 0;
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
      const sanitizedUsers = nearbyUsers.map(({ password, email, phoneNumber, ...rest }) => ({
        ...rest,
        profilePhoto: rest.profilePhoto ? `/api/users/${rest.id}/photo` : null
      }));
      res.status(200).json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get nearby users" });
    }
  });
  apiRouter.post("/bumps", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.session.userId;
      const { bumpedUserId } = req.body;
      if (!bumpedUserId) {
        return res.status(400).json({ message: "bumpedUserId is required" });
      }
      const bumpedUser = await storage.getUser(bumpedUserId);
      if (!bumpedUser) {
        return res.status(404).json({ message: "Bumped user not found" });
      }
      const user = await storage.getUser(userId);
      if (!user || !user.latitude || !user.longitude || !bumpedUser.latitude || !bumpedUser.longitude) {
        return res.status(400).json({ message: "Location data missing" });
      }
      const existingBumps = await storage.getBumpsBetweenUsers(userId, bumpedUserId);
      const isAlreadyBumped = existingBumps.some((b) => b.userId === userId);
      if (isAlreadyBumped) {
        return res.status(400).json({ message: "You have already bumped this user" });
      }
      const bump = await storage.createBump({
        userId,
        bumpedUserId,
        message: req.body.message || null
      });
      const bumpMessageContent = req.body.message || user.bumpMessage || "Hey! I just bumped you \u2728";
      await storage.createMessage({
        senderId: userId,
        receiverId: bumpedUserId,
        content: bumpMessageContent
      });
      await storage.createNotification({
        userId: bumpedUserId,
        type: "bump",
        relatedId: userId,
        // Pass sender ID so receiver can easily bump back
        content: `${user.firstName} bumped you!`
      });
      res.status(201).json(bump);
    } catch (error) {
      res.status(500).json({ message: "Failed to create bump" });
    }
  });
  apiRouter.get("/bumps/received", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.session.userId;
      const allBumps = await storage.getBumpsByUser(userId);
      const received = allBumps.filter((b) => b.bumpedUserId === userId && b.status === "pending");
      const enriched = await Promise.all(
        received.map(async (bump) => {
          const sender = await storage.getUser(bump.userId);
          return {
            ...bump,
            sender: sender ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName,
              gender: sender.gender,
              age: sender.age,
              selfRating: sender.selfRating,
              category: sender.category,
              profilePhoto: sender.profilePhoto ? `/api/users/${sender.id}/photo` : null,
              latitude: parseFloat(sender.latitude),
              longitude: parseFloat(sender.longitude),
              favoriteColor: sender.favoriteColor,
              favoriteSong: sender.favoriteSong,
              fieldOfStudy: sender.fieldOfStudy,
              interests: sender.interests,
              seeking: sender.seeking
            } : null
          };
        })
      );
      res.status(200).json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to get received bumps" });
    }
  });
  apiRouter.patch("/bumps/:id/respond", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const bumpId = parseInt(req.params.id);
      const { action } = req.body;
      if (!["bump_back", "ignore", "reply_later"].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      const statusMap = {
        bump_back: "bumping_back",
        ignore: "rejected",
        reply_later: "pending"
      };
      await storage.updateBump(bumpId, { status: statusMap[action], seen: true });
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      const bump = await storage.getBump(bumpId);
      if (bump && user) {
        let content = "";
        if (action === "bump_back") content = `${user.firstName} bumped you back!`;
        else if (action === "ignore") content = `${user.firstName} isn't interested right now.`;
        else content = `${user.firstName} will reply later.`;
        await storage.createNotification({
          userId: bump.userId,
          type: "bump",
          relatedId: userId,
          content
        });
      }
      res.status(200).json({ success: true, action });
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to bump" });
    }
  });
  apiRouter.patch("/bumps/:id/reveal", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const bumpId = parseInt(req.params.id);
      const userId = req.session.userId;
      const bump = await storage.getBump(bumpId);
      if (!bump) return res.status(404).json({ message: "Bump not found" });
      const isSender = bump.userId === userId;
      const isReceiver = bump.bumpedUserId === userId;
      if (!isSender && !isReceiver) {
        return res.status(403).json({ message: "Not your bump" });
      }
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
      const otherId = isSender ? bump.bumpedUserId : bump.userId;
      if (user) {
        await storage.createNotification({
          userId: otherId,
          type: "bump",
          relatedId: userId,
          content: mutual ? `${user.firstName} also revealed their profile! You can now see each other's full profiles.` : `${user.firstName} wants to reveal profiles. Reveal yours to unlock full access!`
        });
      }
      res.status(200).json({ mutual, status: newStatus });
    } catch (error) {
      res.status(500).json({ message: "Failed to reveal profile" });
    }
  });
  apiRouter.get("/bumps/:userId", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const currentUserId = req.session.userId;
      const otherUserId = parseInt(req.params.userId);
      const bumps2 = await storage.getBumpsBetweenUsers(currentUserId, otherUserId);
      res.status(200).json(bumps2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bumps" });
    }
  });
  apiRouter.get("/bumps/users", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const connectedUsers = await storage.getConnectedUsers(req.session.userId);
      const usersWithDetails = await Promise.all(connectedUsers.map(async (u) => {
        const msgs = await storage.getMessagesBetweenUsers(req.session.userId, u.id);
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
        const unreadCount = await storage.getUnreadMessageCount(req.session.userId, u.id);
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
          unreadCount
        };
      }));
      usersWithDetails.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
        return timeB - timeA;
      });
      res.status(200).json(usersWithDetails);
    } catch (error) {
      console.error("Failed to get connected users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  apiRouter.get("/messages/:userId", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const otherUserId = parseInt(req.params.userId);
      const messages2 = await storage.getMessagesBetweenUsers(req.session.userId, otherUserId);
      await storage.markMessagesAsRead(req.session.userId, otherUserId);
      res.status(200).json(messages2);
    } catch (error) {
      console.error("Failed to get messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  apiRouter.post("/messages", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const { receiverId, content } = req.body;
      if (!receiverId || !content) {
        return res.status(400).json({ message: "Missing receiverId or content" });
      }
      const message = await storage.createMessage({
        senderId: req.session.userId,
        receiverId: parseInt(receiverId),
        content
      });
      const sender = await storage.getUser(req.session.userId);
      await storage.createNotification({
        userId: receiverId,
        type: "message",
        relatedId: req.session.userId,
        content: `${sender?.firstName} sent you a message`
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  apiRouter.get("/notifications", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const notifications2 = await storage.getNotificationsByUser(req.session.userId);
      res.status(200).json(notifications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  apiRouter.post("/notifications/read/:id", async (req, res) => {
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
  apiRouter.post("/notifications/read-all", async (req, res) => {
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
  apiRouter.post("/verify/send", async (req, res) => {
    try {
      const { phoneNumber, firstName } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`;
      const recentCount = await storage.getRecentCodeCount(normalizedPhone, 15);
      if (recentCount >= 3) {
        return res.status(429).json({ message: "Too many verification attempts. Please wait 15 minutes." });
      }
      const code = Math.floor(1e5 + Math.random() * 9e5).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1e3);
      await storage.createVerificationCode(normalizedPhone, code, expiresAt);
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
  apiRouter.post("/verify/check", async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and code are required" });
      }
      const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+1${phoneNumber.replace(/\D/g, "")}`;
      const verification = await storage.getValidVerificationCode(normalizedPhone, code);
      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      await storage.markVerificationCodeUsed(verification.id);
      if (req.session?.userId) {
        await storage.updateUser(req.session.userId, {
          phoneNumber: normalizedPhone,
          isPhoneVerified: true
        });
      }
      res.status(200).json({ message: "Phone verified successfully", verified: true });
    } catch (error) {
      console.error("Verify check error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });
  app2.use("/api", apiRouter);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/api.ts
import cors from "cors";
import rateLimit from "express-rate-limit";
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "face2face-dev-secret";
}
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
var allowedOrigins = [
  "https://bump.bluejax.ai",
  "https://face2face.vercel.app",
  "http://localhost:5000",
  "http://localhost:5173",
  "capacitor://localhost",
  "http://localhost"
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== "production") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 100,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
}));
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use(session2({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 1e3 * 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax"
  }
}));
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});
var initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await registerRoutes(app);
    initialized = true;
  }
}
async function handler(req, res) {
  await ensureInitialized();
  return app(req, res);
}
export {
  handler as default
};
