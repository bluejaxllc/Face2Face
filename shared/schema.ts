import { pgTable, text, serial, integer, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  gender: text("gender").notNull().default("female"), // 'male', 'female'
  age: integer("age").notNull().default(18),
  height: text("height"),
  weight: text("weight"),
  selfRating: integer("self_rating").default(5),
  category: text("category").default("casual"), // "casual" or "intimate"
  bio: text("bio"),
  datingPreference: text("dating_preference").default("women"), // "men", "women"
  favoriteColor: text("favorite_color"),
  favoriteSong: text("favorite_song"),
  fieldOfStudy: text("field_of_study"),
  interests: text("interests"), // Comma-separated or JSON string
  seeking: text("seeking"), // Comma-separated or JSON string
  bumpMessage: text("bump_message"), // Default message when bumping
  isActive: boolean("is_active").default(true),
  inactiveTimeout: integer("inactive_timeout").default(30), // minutes
  latitude: numeric("latitude").notNull().default("0"),
  longitude: numeric("longitude").notNull().default("0"),
  lastLocation: timestamp("last_location"),
  profileCompleted: boolean("profile_completed").default(false),
  profilePhoto: text("profile_photo"), // base64 encoded photo string
  phoneNumber: text("phone_number").unique(),
  isPhoneVerified: boolean("is_phone_verified").default(false),
});

export const bumps = pgTable("bumps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bumpedUserId: integer("bumped_user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  seen: boolean("seen").default(false),
  status: text("status").default("pending"), // "pending", "initiated", "completed" or "rejected", "bumping_back", "revealed"
  message: text("message"), // Optional message sent with the bump
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "bump", "message"
  relatedId: integer("related_id"), // The ID of the bump or message
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  gender: true,
  age: true,
  selfRating: true,
  datingPreference: true,
  phoneNumber: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
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
});

export const insertBumpSchema = createInsertSchema(bumps).pick({
  userId: true,
  bumpedUserId: true,
  status: true,
  message: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  relatedId: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBump = z.infer<typeof insertBumpSchema>;
export type Bump = typeof bumps.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type VerificationCode = typeof verificationCodes.$inferSelect;
