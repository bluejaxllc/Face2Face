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
  verificationCodes,
  type VerificationCode,
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
    userGender?: string;
    ageRange?: { min: number, max: number };
  }): Promise<User[]>;

  // Bump operations
  createBump(bump: InsertBump): Promise<Bump>;
  getBump(id: number): Promise<Bump | undefined>;
  updateBump(id: number, updates: Partial<{ status: string; seen: boolean }>): Promise<Bump | undefined>;
  getBumpsBetweenUsers(userId: number, bumpedUserId: number): Promise<Bump[]>;
  getBumpsByUser(userId: number): Promise<Bump[]>;
  getRecentBumps(userId: number, limit?: number): Promise<Bump[]>;


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
      userGender?: string;
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
}

// Always use database storage — DATABASE_URL is required
export const storage = new DatabaseStorage();