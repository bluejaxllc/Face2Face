import { pgTable, text, serial, integer, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
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
  category: text("category").default("friendships"), // "dating", "business", "friendships"
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
  safetyAcknowledged: boolean("safety_acknowledged").default(false),
  
  // Business fields
  jobTitle: text("job_title"),
  company: text("company"),
  industry: text("industry"),
  skills: text("skills"),
  networkingGoal: text("networking_goal"),
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  professionalMotto: text("professional_motto"),
  businessPhone: text("business_phone"),
  businessNeed: text("business_need"),
  businessPartners: text("business_partners"),
  isNetworkingOpen: boolean("is_networking_open").default(true),
  isHiring: boolean("is_hiring").default(false),
  hiringRoles: text("hiring_roles"),
  menuData: text("menu_data"),
  businessService: text("business_service"),
  businessSlogan: text("business_slogan"),
  openPositions: integer("open_positions"),
  
  // Custom business links
  websiteUrl: text("website_url"),
  menuUrl: text("menu_url"),
  bookingUrl: text("booking_url"),
}, (table) => {
  return {
    usernameIdx: index("username_idx").on(table.username),
    emailIdx: index("email_idx").on(table.email),
    phoneIdx: index("phone_idx").on(table.phoneNumber),
    isActiveIdx: index("is_active_idx").on(table.isActive)
  };
});

export const bumps = pgTable("bumps", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bumpedUserId: integer("bumped_user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  seen: boolean("seen").default(false),
  status: text("status").default("pending"), // "pending", "initiated", "completed" or "rejected", "bumping_back", "revealed"
  message: text("message"), // Optional message sent with the bump
}, (table) => {
  return {
    userIdIdx: index("bump_user_id_idx").on(table.userId),
    bumpedUserIdIdx: index("bumped_user_id_idx").on(table.bumpedUserId)
  };
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false),
}, (table) => {
  return {
    senderIdIdx: index("message_sender_id_idx").on(table.senderId),
    receiverIdIdx: index("message_receiver_id_idx").on(table.receiverId)
  };
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "bump"
  relatedId: integer("related_id"), // The ID of the bump or message
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  read: boolean("read").default(false),
}, (table) => {
  return {
    userIdIdx: index("notification_user_id_idx").on(table.userId)
  };
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    phoneCodeIdx: index("phone_code_idx").on(table.phoneNumber, table.code)
  };
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
  safetyAcknowledged: true,
  
  // Business fields
  jobTitle: true,
  company: true,
  industry: true,
  skills: true,
  networkingGoal: true,
  linkedinUrl: true,
  portfolioUrl: true,
  professionalMotto: true,
  businessPhone: true,
  businessNeed: true,
  businessPartners: true,
  isNetworkingOpen: true,
  isHiring: true,
  hiringRoles: true,
  menuData: true,
  businessService: true,
  businessSlogan: true,
  openPositions: true,
  websiteUrl: true,
  menuUrl: true,
  bookingUrl: true,
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
