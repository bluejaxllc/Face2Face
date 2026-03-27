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
import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  gender: text("gender").notNull().default("other"),
  // 'male', 'female', 'other'
  age: integer("age").notNull().default(18),
  height: text("height"),
  weight: text("weight"),
  selfRating: integer("self_rating").default(5),
  category: text("category").default("casual"),
  // "casual" or "intimate"
  bio: text("bio"),
  datingPreference: text("dating_preference").default("all"),
  // "men", "women", "all"
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
  isPhoneVerified: boolean("is_phone_verified").default(false)
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
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false)
});
var notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  // "bump", "message"
  relatedId: integer("related_id"),
  // The ID of the bump or message
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false)
});
var verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow()
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
  isPhoneVerified: true
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
    const latDelta = radius / 69;
    const lngDelta = radius / (69 * Math.cos(latitude * Math.PI / 180));
    const conditions = [
      sql`${users.id} != ${userId}`,
      eq(users.isActive, true),
      sql`${users.latitude} IS NOT NULL`,
      sql`${users.longitude} IS NOT NULL`,
      // Bounding box filter (fast index-friendly pre-filter)
      sql`CAST(${users.latitude} AS DOUBLE PRECISION) BETWEEN ${latitude - latDelta} AND ${latitude + latDelta}`,
      sql`CAST(${users.longitude} AS DOUBLE PRECISION) BETWEEN ${longitude - lngDelta} AND ${longitude + lngDelta}`,
      // Dynamic inactive timeout check!
      sql`${users.lastLocation} > NOW() - (CAST(${users.inactiveTimeout} AS integer) || ' minutes')::interval`,
      // Exact Haversine distance filter in SQL
      sql`(
        3958.8 * 2 * ASIN(SQRT(
          POWER(SIN((RADIANS(CAST(${users.latitude} AS DOUBLE PRECISION)) - RADIANS(${latitude})) / 2), 2) +
          COS(RADIANS(${latitude})) * COS(RADIANS(CAST(${users.latitude} AS DOUBLE PRECISION))) *
          POWER(SIN((RADIANS(CAST(${users.longitude} AS DOUBLE PRECISION)) - RADIANS(${longitude})) / 2), 2)
        ))
      ) <= ${radius}`
    ];
    if (preferences.category && preferences.category !== "both") {
      conditions.push(eq(users.category, preferences.category));
    }
    let datingPref = "all";
    if (preferences.datingPreference && preferences.datingPreference !== "all") {
      datingPref = preferences.datingPreference;
    }
    const datingPrefCondition = or(
      eq(users.datingPreference, "all"),
      eq(users.datingPreference, datingPref)
    );
    if (datingPrefCondition) {
      conditions.push(datingPrefCondition);
    }
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
  async createMessage(insertMessage) {
    const result = await db.insert(messages).values({
      ...insertMessage,
      timestamp: /* @__PURE__ */ new Date(),
      read: false
    }).returning();
    return result[0];
  }
  async getMessagesBetweenUsers(userId1, userId2) {
    return await db.select().from(messages).where(or(
      and(
        eq(messages.senderId, userId1),
        eq(messages.receiverId, userId2)
      ),
      and(
        eq(messages.senderId, userId2),
        eq(messages.receiverId, userId1)
      )
    )).orderBy(asc(messages.timestamp));
  }
  async getUnreadMessageCount(userId) {
    const result = await db.select({ count: sql`count(*)` }).from(messages).where(and(
      eq(messages.receiverId, userId),
      eq(messages.read, false)
    ));
    return result[0]?.count || 0;
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
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  gender: z.string().optional().default("other"),
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
      res.status(201).json(userWithoutPassword);
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
      res.status(200).json(userWithoutPassword);
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
      res.status(200).json(userWithoutPassword);
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
      res.status(200).json(userWithoutPassword);
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
  apiRouter.get("/users/:id", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const idStr = req.params.id;
      if (idStr === "profile" || idStr === "location" || idStr === "nearby") {
        return res.status(404).json({ message: "Invalid user ID" });
      }
      const userId = parseInt(idStr);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, email, ...safeUser } = user;
      res.status(200).json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user details" });
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
      const datingPreference = req.query.datingPreference;
      const nearbyUsers = await storage.getNearbyUsers(
        Number(user.latitude),
        Number(user.longitude),
        radius,
        user.id,
        {
          category,
          datingPreference
        }
      );
      const sanitizedUsers = nearbyUsers.map(({ password, email, ...rest }) => rest);
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
      const bump = await storage.createBump({
        userId,
        bumpedUserId
      });
      await storage.createNotification({
        userId: bumpedUserId,
        type: "bump",
        relatedId: userId,
        // Pass sender ID so receiver can easily bump back
        content: `You've connected with ${user.firstName}!`
      });
      res.status(201).json(bump);
    } catch (error) {
      res.status(500).json({ message: "Failed to create bump" });
    }
  });
  apiRouter.get("/bumps/users", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const userId = req.session.userId;
      const allBumps = await storage.getBumpsByUser(userId);
      const uniqueUserIds = /* @__PURE__ */ new Set();
      allBumps.forEach((bump) => {
        if (bump.userId === userId) {
          uniqueUserIds.add(bump.bumpedUserId);
        } else {
          uniqueUserIds.add(bump.userId);
        }
      });
      const bumpedUsers = await Promise.all(
        Array.from(uniqueUserIds).map(async (id) => {
          const user = await storage.getUser(id);
          if (user) {
            const messages2 = await storage.getMessagesBetweenUsers(userId, id);
            const lastMessage = messages2.length > 0 ? messages2[messages2.length - 1] : null;
            const unreadCount = messages2.filter((m) => m.receiverId === userId && !m.read).length;
            return {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profilePhoto: user.profilePhoto,
              lastMessage: lastMessage ? { content: lastMessage.content, timestamp: lastMessage.timestamp, senderId: lastMessage.senderId } : null,
              unreadCount
            };
          }
          return null;
        })
      );
      const sorted = bumpedUsers.filter(Boolean).sort((a, b) => {
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
  apiRouter.post("/messages", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const senderId = req.session.userId;
      const { receiverId, content: rawContent } = req.body;
      if (!receiverId || !rawContent) {
        return res.status(400).json({ message: "receiverId and content are required" });
      }
      const content = sanitizeInput(String(rawContent), 2e3);
      if (content.length === 0) {
        return res.status(400).json({ message: "Message content cannot be empty" });
      }
      const receiver = await storage.getUser(receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      const bumps2 = await storage.getBumpsBetweenUsers(senderId, receiverId);
      if (bumps2.length === 0) {
        return res.status(403).json({ message: "You need to bump into this user before messaging" });
      }
      const message = await storage.createMessage({
        senderId,
        receiverId,
        content
      });
      const sender = await storage.getUser(senderId);
      await storage.createNotification({
        userId: receiverId,
        type: "message",
        relatedId: message.id,
        content: `${sender?.username} sent you a message`
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  apiRouter.get("/messages/:userId", async (req, res) => {
    try {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const currentUserId = req.session.userId;
      const otherUserId = parseInt(req.params.userId);
      const bumps2 = await storage.getBumpsBetweenUsers(currentUserId, otherUserId);
      if (bumps2.length === 0) {
        return res.status(403).json({ message: "You need to bump into this user to see messages" });
      }
      const messages2 = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
      res.status(200).json(messages2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get messages" });
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
