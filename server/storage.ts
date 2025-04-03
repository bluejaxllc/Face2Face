import {
  users,
  type User,
  type InsertUser,
  type UpdateUser,
  bumps,
  type Bump,
  type InsertBump,
  messages,
  type Message,
  type InsertMessage,
  notifications,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { eq, or, and, desc, asc, sql, SQL } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { log } from "./vite";
import { calculateDistance } from "../client/src/lib/distance";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<UpdateUser>): Promise<User | undefined>;
  getNearbyUsers(latitude: number, longitude: number, radius: number, userId: number, preferences?: {
    category?: string;
    datingPreference?: string;
    ageRange?: { min: number, max: number };
  }): Promise<User[]>;
  
  // Bump operations
  createBump(bump: InsertBump): Promise<Bump>;
  getBumpsBetweenUsers(userId: number, bumpedUserId: number): Promise<Bump[]>;
  getBumpsByUser(userId: number): Promise<Bump[]>;
  getRecentBumps(userId: number, limit?: number): Promise<Bump[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number): Promise<number>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    
    // Set up session store
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });
    
    log("Database connection established", "storage");
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      height: null,
      weight: null,
      selfRating: 5,
      category: "bump",
      bio: null,
      datingPreference: "all",
      isActive: true,
      latitude: null,
      longitude: null,
      lastLocation: new Date(),
      profileCompleted: false,
    }).returning();
    
    return result[0];
  }
  
  async updateUser(id: number, updates: Partial<UpdateUser>): Promise<User | undefined> {
    // If updating location, also update the lastLocation timestamp
    const updateData = {
      ...updates,
      ...(updates.latitude !== undefined && updates.longitude !== undefined 
          ? { lastLocation: new Date() } 
          : {})
    };
    
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius: number,
    userId: number,
    preferences: {
      category?: string;
      datingPreference?: string;
      ageRange?: { min: number; max: number };
    } = {}
  ): Promise<User[]> {
    // Build query conditions
    const conditions = [
      // Not the current user
      sql`${users.id} != ${userId}`,
      // Only active users
      eq(users.isActive, true),
      // Must have location
      sql`${users.latitude} IS NOT NULL`,
      sql`${users.longitude} IS NOT NULL`
    ];
    
    // Add category filter if specified
    if (preferences.category && preferences.category !== "both") {
      conditions.push(eq(users.category, preferences.category));
    }
    
    // Handle dating preferences
    // We need to find users who either:
    // 1. Have "all" as their dating preference, OR
    // 2. Have the specific preference that matches the current user's filter
    
    // Default to "all"
    let datingPref = 'all';
    // Update if preference is specified and not "all"
    if (preferences.datingPreference && preferences.datingPreference !== "all") {
      datingPref = preferences.datingPreference;
    }
    
    // Create condition for dating preference
    const datingPrefCondition = or(
      eq(users.datingPreference, 'all'),
      eq(users.datingPreference, datingPref)
    );
    
    // Add to conditions
    if (datingPrefCondition) {
      conditions.push(datingPrefCondition);
    }
    
    // Execute the query with all conditions
    // Make sure we have at least one condition
    if (conditions.length === 0) {
      conditions.push(eq(users.id, users.id)); // Always true condition as fallback
    }
    
    const allPotentialUsers = await db.select()
      .from(users)
      .where(and(...conditions));
    
    // Now filter by distance (done in application code since this is more efficient than a DB function for our case)
    return allPotentialUsers.filter(user => {
      if (user.latitude === null || user.longitude === null) return false;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        Number(user.latitude),
        Number(user.longitude)
      );
      
      return distance <= radius;
    });
  }
  
  async createBump(insertBump: InsertBump): Promise<Bump> {
    const result = await db.insert(bumps).values({
      ...insertBump,
      timestamp: new Date(),
      seen: false,
    }).returning();
    
    return result[0];
  }
  
  async getBumpsBetweenUsers(userId: number, bumpedUserId: number): Promise<Bump[]> {
    return await db.select()
      .from(bumps)
      .where(or(
        and(
          eq(bumps.userId, userId),
          eq(bumps.bumpedUserId, bumpedUserId)
        ),
        and(
          eq(bumps.userId, bumpedUserId),
          eq(bumps.bumpedUserId, userId)
        )
      ))
      .orderBy(desc(bumps.timestamp));
  }
  
  async getBumpsByUser(userId: number): Promise<Bump[]> {
    return await db.select()
      .from(bumps)
      .where(or(
        eq(bumps.userId, userId),
        eq(bumps.bumpedUserId, userId)
      ))
      .orderBy(desc(bumps.timestamp));
  }
  
  async getRecentBumps(userId: number, limit: number = 10): Promise<Bump[]> {
    return await db.select()
      .from(bumps)
      .where(or(
        eq(bumps.userId, userId),
        eq(bumps.bumpedUserId, userId)
      ))
      .orderBy(desc(bumps.timestamp))
      .limit(limit);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      ...insertMessage,
      timestamp: new Date(),
      read: false,
    }).returning();
    
    return result[0];
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(or(
        and(
          eq(messages.senderId, userId1),
          eq(messages.receiverId, userId2)
        ),
        and(
          eq(messages.senderId, userId2),
          eq(messages.receiverId, userId1)
        )
      ))
      .orderBy(asc(messages.timestamp));
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.read, false)
      ));
    
    return result[0]?.count || 0;
  }
  
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values({
      ...insertNotification,
      timestamp: new Date(),
      read: false,
    }).returning();
    
    return result[0];
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.timestamp));
  }
  
  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ))
      .orderBy(desc(notifications.timestamp));
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }
}

// Memory storage implementation for when database is not available
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bumps: Map<number, Bump>;
  private messages: Map<number, Message>;
  private notifications: Map<number, Notification>;
  public sessionStore: session.Store;
  
  private userIdCounter: number;
  private bumpIdCounter: number;
  private messageIdCounter: number;
  private notificationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.bumps = new Map();
    this.messages = new Map();
    this.notifications = new Map();
    
    this.userIdCounter = 1;
    this.bumpIdCounter = 1;
    this.messageIdCounter = 1;
    this.notificationIdCounter = 1;
    
    // Create memory store for sessions
    const MemoryStore = memorystore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      height: null,
      weight: null,
      selfRating: 5,
      category: "bump",
      bio: null,
      datingPreference: "all",
      isActive: true,
      latitude: null,
      longitude: null,
      lastLocation: now,
      profileCompleted: false,
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<UpdateUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    
    // If we're updating location, also update the last location timestamp
    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      updatedUser.lastLocation = new Date();
    }
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius: number,
    userId: number,
    preferences: {
      category?: string;
      datingPreference?: string;
      ageRange?: { min: number, max: number };
    } = {}
  ): Promise<User[]> {
    // Filter active users, exclude the requesting user
    const activeUsers = Array.from(this.users.values()).filter(
      user => user.isActive && user.id !== userId && user.latitude && user.longitude
    );
    
    let filteredUsers = activeUsers;
    
    // Apply category filter if specified
    if (preferences.category && preferences.category !== "both") {
      filteredUsers = filteredUsers.filter(user => user.category === preferences.category);
    }
    
    // Apply dating preference filter if specified
    if (preferences.datingPreference && preferences.datingPreference !== "all") {
      // This is simplified. In a real app, you would need to match user preferences
      filteredUsers = filteredUsers.filter(user => 
        user.datingPreference === "all" || user.datingPreference === preferences.datingPreference
      );
    }
    
    // Filter by distance
    return filteredUsers.filter(user => {
      if (user.latitude === null || user.longitude === null) return false;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        Number(user.latitude),
        Number(user.longitude)
      );
      
      return distance <= radius;
    });
  }
  
  // Bump operations
  async createBump(insertBump: InsertBump): Promise<Bump> {
    const id = this.bumpIdCounter++;
    const now = new Date();
    const bump: Bump = {
      ...insertBump,
      id,
      timestamp: now,
      seen: false,
    };
    this.bumps.set(id, bump);
    return bump;
  }
  
  async getBumpsBetweenUsers(userId: number, bumpedUserId: number): Promise<Bump[]> {
    return Array.from(this.bumps.values()).filter(
      bump => 
        (bump.userId === userId && bump.bumpedUserId === bumpedUserId) ||
        (bump.userId === bumpedUserId && bump.bumpedUserId === userId)
    );
  }
  
  async getBumpsByUser(userId: number): Promise<Bump[]> {
    return Array.from(this.bumps.values()).filter(
      bump => bump.userId === userId || bump.bumpedUserId === userId
    );
  }
  
  async getRecentBumps(userId: number, limit: number = 10): Promise<Bump[]> {
    return Array.from(this.bumps.values())
      .filter(bump => bump.userId === userId || bump.bumpedUserId === userId)
      .sort((a, b) => {
        // Handle null timestamps safely
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      })
      .slice(0, limit);
  }
  
  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: now,
      read: false,
    };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        message => 
          (message.senderId === userId1 && message.receiverId === userId2) ||
          (message.senderId === userId2 && message.receiverId === userId1)
      )
      .sort((a, b) => {
        // Handle null timestamps safely
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return a.timestamp.getTime() - b.timestamp.getTime();
      });
  }
  
  async getUnreadMessageCount(userId: number): Promise<number> {
    return Array.from(this.messages.values()).filter(
      message => message.receiverId === userId && !message.read
    ).length;
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    // Create a properly typed notification object
    const notification: Notification = {
      id,
      userId: insertNotification.userId,
      type: insertNotification.type,
      content: insertNotification.content,
      timestamp: now,
      read: false,
      relatedId: insertNotification.relatedId || null
    };
    
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => {
        // Handle null timestamps safely
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }
  
  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .sort((a, b) => {
        // Handle null timestamps safely
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifications.set(id, notification);
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .forEach(notification => {
        notification.read = true;
        this.notifications.set(notification.id, notification);
      });
  }
}

// Choose the appropriate storage implementation based on environment
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage()
  : new MemStorage();