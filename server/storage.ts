import {
  users,
  type User,
  type InsertUser,
  type UpdateUser,
  bumps,
  type Bump,
  type InsertBump,
  notifications,
  type Notification,
  type InsertNotification,
  messages,
  type Message,
  type InsertMessage,
  verificationCodes,
  type VerificationCode,
  waitlists,
  type Waitlist,
  type InsertWaitlist,
  datingEvents,
  type DatingEvent,
  type InsertDatingEvent,
} from "@shared/schema";
import { eq, or, and, desc, asc, sql, SQL } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { log } from "./log";

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
    userSex?: string;
    ageRange?: { min: number, max: number };
  }): Promise<User[]>;

  // Bump operations
  createBump(bump: InsertBump): Promise<Bump>;
  getBump(id: number): Promise<Bump | undefined>;
  updateBump(id: number, updates: Partial<{ status: string; seen: boolean }>): Promise<Bump | undefined>;
  getBumpsBetweenUsers(userId: number, bumpedUserId: number): Promise<Bump[]>;
  getBumpsByUser(userId: number): Promise<Bump[]>;
  getRecentBumps(userId: number, limit?: number): Promise<Bump[]>;
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  getUnreadMessageCount(userId: number, fromUserId?: number): Promise<number>;
  markMessagesAsRead(userId: number, fromUserId: number): Promise<void>;
  getConnectedUsers(userId: number): Promise<User[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;

  // Session store
  sessionStore: session.Store;

  // Verification code operations
  createVerificationCode(phoneNumber: string, code: string, expiresAt: Date): Promise<VerificationCode>;
  getValidVerificationCode(phoneNumber: string, code: string): Promise<VerificationCode | undefined>;
  markVerificationCodeUsed(id: number): Promise<void>;
  getRecentCodeCount(phoneNumber: string, sinceMinutes: number): Promise<number>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  deactivateInactiveUsers(): Promise<number>;

  // Waitlist operations
  createWaitlist(data: InsertWaitlist): Promise<Waitlist>;
  getWaitlists(type?: 'individual' | 'business'): Promise<Waitlist[]>;

  // Dating Event operations
  createDatingEvent(event: InsertDatingEvent & { userId: number }): Promise<DatingEvent>;
  getDatingEvents(params?: { type?: string; location?: string }): Promise<DatingEvent[]>;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

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
    }).returning();

    return result[0];
  }

  async updateUser(id: number, updates: Partial<UpdateUser>): Promise<User | undefined> {
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
      userSex?: string;
      ageRange?: { min: number; max: number };
    } = {}
  ): Promise<User[]> {
    // Show ALL active users with real coordinates (not default 0,0)
    // No distance or preference filtering — everyone should be visible on the map
    const conditions: SQL[] = [
      sql`${users.id} != ${userId}`,
      eq(users.isActive, true),
      sql`${users.latitude} IS NOT NULL`,
      sql`${users.longitude} IS NOT NULL`,
      // Exclude users who still have the default 0,0 coordinates (never set location)
      sql`NOT (CAST(${users.latitude} AS DOUBLE PRECISION) = 0 AND CAST(${users.longitude} AS DOUBLE PRECISION) = 0)`,
      // Only show users who have been active/pinged location in the last 30 minutes
      sql`${users.lastLocation} > NOW() - INTERVAL '30 minutes'`,
    ];

    return await db.select()
      .from(users)
      .where(and(...conditions));
  }

  async createBump(insertBump: InsertBump): Promise<Bump> {
    const result = await db.insert(bumps).values({
      ...insertBump,
      timestamp: new Date(),
      seen: false,
    }).returning();

    return result[0];
  }

  async getBump(id: number): Promise<Bump | undefined> {
    const result = await db.select().from(bumps).where(eq(bumps.id, id)).limit(1);
    return result[0];
  }

  async updateBump(id: number, updates: Partial<{ status: string; seen: boolean }>): Promise<Bump | undefined> {
    const result = await db.update(bumps).set(updates).where(eq(bumps.id, id)).returning();
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

  // Message Operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      ))
      .orderBy(asc(messages.timestamp));
  }

  async getUnreadMessageCount(userId: number, fromUserId?: number): Promise<number> {
    const conditions = [
      eq(messages.receiverId, userId),
      eq(messages.read, false)
    ];
    if (fromUserId) {
      conditions.push(eq(messages.senderId, fromUserId));
    }

    const result = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(...conditions));

    return Number(result[0]?.count || 0);
  }

  async markMessagesAsRead(userId: number, fromUserId: number): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.receiverId, userId),
        eq(messages.senderId, fromUserId),
        eq(messages.read, false)
      ));
  }

  async getConnectedUsers(userId: number): Promise<User[]> {
    const userBumps = await db.select()
      .from(bumps)
      .where(or(
        eq(bumps.userId, userId),
        eq(bumps.bumpedUserId, userId)
      ));

    const connectedSet = new Set<number>();
    for (const b of userBumps) {
      if (b.userId !== userId) connectedSet.add(b.userId);
      if (b.bumpedUserId !== userId) connectedSet.add(b.bumpedUserId);
    }

    // Also include anyone who has exchanged messages just in case
    const chatHistory = await db.select()
      .from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ));

    for (const m of chatHistory) {
      if (m.senderId !== userId) connectedSet.add(m.senderId);
      if (m.receiverId !== userId) connectedSet.add(m.receiverId);
    }

    if (connectedSet.size === 0) return [];

    // Fallback if there are too many or we need a specific query array format
    // Because IN clause requires array.
    const userIds = Array.from(connectedSet);

    // We fetch one by one or chunk if needed, but for simplicity here use JS filter/map or multiple ORs.
    // Alternatively, Drizzle `inArray`:
    const { inArray } = await import('drizzle-orm');

    const connectedUsers = await db.select()
      .from(users)
      .where(inArray(users.id, userIds));

    return connectedUsers;
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

  // Verification code operations
  async createVerificationCode(phoneNumber: string, code: string, expiresAt: Date): Promise<VerificationCode> {
    const result = await db.insert(verificationCodes).values({
      phoneNumber,
      code,
      expiresAt,
      used: false,
    }).returning();
    return result[0];
  }

  async getValidVerificationCode(phoneNumber: string, code: string): Promise<VerificationCode | undefined> {
    const result = await db.select()
      .from(verificationCodes)
      .where(and(
        eq(verificationCodes.phoneNumber, phoneNumber),
        eq(verificationCodes.code, code),
        eq(verificationCodes.used, false),
        sql`${verificationCodes.expiresAt} > NOW()`
      ))
      .orderBy(desc(verificationCodes.id))
      .limit(1);
    return result[0];
  }

  async markVerificationCodeUsed(id: number): Promise<void> {
    await db.update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, id));
  }

  async getRecentCodeCount(phoneNumber: string, sinceMinutes: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(verificationCodes)
      .where(and(
        eq(verificationCodes.phoneNumber, phoneNumber),
        sql`${verificationCodes.createdAt} > NOW() - INTERVAL '${sql.raw(String(sinceMinutes))} minutes'`
      ));
    return result[0]?.count || 0;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.phoneNumber, phone)).limit(1);
    return result[0];
  }

  /**
   * Deactivate users who have exceeded their personal inactiveTimeout.
   * Compares lastLocation timestamp against inactiveTimeout (in minutes).
   * Returns the number of users deactivated.
   */
  async deactivateInactiveUsers(): Promise<number> {
    const result = await db.update(users)
      .set({ isActive: false })
      .where(and(
        eq(users.isActive, true),
        sql`${users.lastLocation} IS NOT NULL`,
        sql`${users.inactiveTimeout} IS NOT NULL`,
        sql`${users.inactiveTimeout} > 0`,
        sql`${users.lastLocation} < NOW() - (${users.inactiveTimeout} || ' minutes')::INTERVAL`
      ))
      .returning();
    return result.length;
  }

  async createWaitlist(data: InsertWaitlist): Promise<Waitlist> {
    const [waitlist] = await db.insert(waitlists).values(data).returning();
    return waitlist;
  }

  async getWaitlists(type?: 'individual' | 'business'): Promise<Waitlist[]> {
    if (type) {
      return await db.select().from(waitlists).where(eq(waitlists.type, type)).orderBy(desc(waitlists.createdAt));
    }
    return await db.select().from(waitlists).orderBy(desc(waitlists.createdAt));
  }

  async createDatingEvent(event: InsertDatingEvent & { userId: number }): Promise<DatingEvent> {
    const result = await db.insert(datingEvents).values(event).returning();
    return result[0];
  }

  async getDatingEvents(params?: { type?: string; location?: string }): Promise<DatingEvent[]> {
    let conditions = [];
    if (params?.type) conditions.push(eq(datingEvents.type, params.type));
    if (params?.location) conditions.push(eq(datingEvents.location, params.location));
    
    // Always filter for active events
    conditions.push(eq(datingEvents.isActive, true));

    if (conditions.length > 0) {
      return await db.select().from(datingEvents).where(and(...conditions)).orderBy(desc(datingEvents.timestamp));
    }
    
    return await db.select().from(datingEvents).where(eq(datingEvents.isActive, true)).orderBy(desc(datingEvents.timestamp));
  }
}

// Always use database storage — DATABASE_URL is required
export const storage = new DatabaseStorage();