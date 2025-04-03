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
  height: text("height"),
  weight: text("weight"),
  selfRating: integer("self_rating").default(5),
  category: text("category").default("bump"), // "bump" or "grind"
  bio: text("bio"),
  datingPreference: text("dating_preference").default("all"), // "men", "women", "all"
  isActive: boolean("is_active").default(true),
  latitude: numeric("latitude").notNull().default("0"),
  longitude: numeric("longitude").notNull().default("0"),
  lastLocation: timestamp("last_location"),
  profileCompleted: boolean("profile_completed").default(false),
});

export const bumps = pgTable("bumps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bumpedUserId: integer("bumped_user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  seen: boolean("seen").default(false),
  status: text("status").default("pending"), // "pending", "initiated", "completed" or "rejected"
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  height: true,
  weight: true,
  selfRating: true,
  category: true,
  bio: true,
  datingPreference: true,
  isActive: true,
  latitude: true,
  longitude: true,
  lastLocation: true,
  profileCompleted: true,
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
