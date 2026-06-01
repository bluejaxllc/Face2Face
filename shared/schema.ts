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
  sex: text("sex").notNull().default("female"), // 'male', 'female', 'custom'
  age: integer("age").notNull().default(18),
  displayAge: text("display_age"),
  dateOfBirth: timestamp("date_of_birth"),
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
  profilePhoto: text("profile_photo"), // URL path to photo on persistent volume or base64
  phoneNumber: text("phone_number").unique(),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  safetyAcknowledged: boolean("safety_acknowledged").default(false),
  pushToken: text("push_token"), // Temporarily added to prevent db:push rejection
  subscriptionTier: text("subscription_tier"), // Temporarily added to prevent db:push rejection
  subscriptionExpiresAt: timestamp("subscription_expires_at"), // Temporarily added to prevent db:push rejection
  // Specialized Category Fields
  // Business - Professional
  jobTitle: text("job_title"),
  company: text("company"),
  industry: text("industry"),
  skills: text("skills"), // Comma-separated
  networkingGoal: text("networking_goal"), // "hiring", "investing", "mentorship", "networking"
  linkedinUrl: text("linkedin_url"),
  portfolioUrl: text("portfolio_url"),
  professionalMotto: text("professional_motto"),

  // Friends - Social
  vibeStatus: text("vibe_status"), // "chill", "energetic", "productive", etc.
  currentActivity: text("current_activity"), // "working on a project", "drinking coffee"
  icebreaker: text("icebreaker"), // Response to a random question
  weekendVibe: text("weekend_vibe"), // "outdoors", "gaming", "relaxing", "nightlife"
  socialBattery: text("social_battery"), // "introvert", "extrovert", "ambivert"

  // Dating - Romantic
  relationshipGoal: text("relationship_goal"), // "long-term", "short-term", "chatting"
  datingMode: text("dating_mode"), // "viewing", "seeking", "offering", "events"
  loveLanguage: text("love_language"),
  mbti: text("mbti"),
  perfectDate: text("perfect_date"),
  lifestyleCoffee: text("lifestyle_coffee"), // "addict", "decal", "none"
  lifestyleAlcohol: text("lifestyle_alcohol"), // "social", "frequent", "never"
  lifestyleSchedule: text("lifestyle_schedule"), // "morning", "night", "flexible"
  bannerPhoto: text("banner_photo"), // URL path to banner on persistent volume or base64
  isPublic: boolean("is_public").default(true),
  // New Business Fields
  businessSlogan: text("business_slogan"),
  businessPhone: text("business_phone"),
  businessService: text("business_service"),
  businessNeed: text("business_need"),
  businessPartners: text("business_partners"),
  isNetworkingOpen: boolean("is_networking_open").default(true),
  isHiring: boolean("is_hiring").default(false),
  openPositions: integer("open_positions").default(0),
  hiringRoles: text("hiring_roles"),
  menuData: text("menu_data"), // JSON string of menu items: [{name, price, desc}]
  websiteUrl: text("website_url"),
  menuUrl: text("menu_url"),
  bookingUrl: text("booking_url"),
  deletedAt: timestamp("deleted_at"), // Soft delete timestamp
}, (table) => {
  return {
    usernameIdx: index("username_idx").on(table.username),
    emailIdx: index("email_idx").on(table.email),
    phoneIdx: index("phone_idx").on(table.phoneNumber),
    isActiveIdx: index("is_active_idx").on(table.isActive)
  };
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // "dating", "business", "friendships"
  isApproved: boolean("is_approved").default(true), // true by default, filter NSFW for friends 
}, (table) => {
  return {
    nameIdx: index("tag_name_idx").on(table.name),
    categoryIdx: index("tag_category_idx").on(table.category)
  };
});

export const communityGroups = pgTable("community_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), 
  imageUrl: text("image_url"),
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

export const datingEvents = pgTable("dating_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'seek', 'offer', 'event'
  title: text("title"),
  description: text("description").notNull(),
  date: text("date"),
  location: text("location"),
  timestamp: timestamp("timestamp").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertDatingEventSchema = createInsertSchema(datingEvents).pick({
  type: true,
  title: true,
  description: true,
  date: true,
  location: true,
});

export type InsertDatingEvent = z.infer<typeof insertDatingEventSchema>;
export type DatingEvent = typeof datingEvents.$inferSelect;

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

export const waitlists = pgTable("waitlists", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'individual' or 'business'
  name: text("name").notNull(), // contact person or individual name
  email: text("email").notNull(),
  
  // Optional / Business specific
  businessName: text("business_name"),
  location: text("location"),
  phone: text("phone"),
  socialLink: text("social_link"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaitlistSchema = createInsertSchema(waitlists);
export type Waitlist = typeof waitlists.$inferSelect;
export type InsertWaitlist = typeof waitlists.$inferInsert;

export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull(),
  blockedId: integer("blocked_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  blockerIdx: index("block_blocker_idx").on(table.blockerId),
  blockedIdx: index("block_blocked_idx").on(table.blockedId),
}));

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  reportedId: integer("reported_id").notNull(),
  reason: text("reason").notNull(), // 'harassment', 'fake_profile', 'inappropriate', 'spam', 'underage', 'other'
  details: text("details"),
  status: text("status").default("pending"), // 'pending', 'reviewed', 'action_taken', 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  reporterIdx: index("report_reporter_idx").on(table.reporterId),
  reportedIdx: index("report_reported_idx").on(table.reportedId),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  sex: true,
  age: true,
  dateOfBirth: true,
  datingPreference: true,
  phoneNumber: true,
  bannerPhoto: true,
  isPublic: true,
  displayAge: true,
  businessSlogan: true,
  openPositions: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  sex: true,
  age: true,
  displayAge: true,
  dateOfBirth: true,
  height: true,
  weight: true,
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
  jobTitle: true,
  company: true,
  industry: true,
  skills: true,
  networkingGoal: true,
  linkedinUrl: true,
  portfolioUrl: true,
  professionalMotto: true,
  vibeStatus: true,
  currentActivity: true,
  icebreaker: true,
  weekendVibe: true,
  socialBattery: true,
  relationshipGoal: true,
  datingMode: true,
  bannerPhoto: true,
  isPublic: true,
  businessPhone: true,
  businessService: true,
  businessNeed: true,
  businessPartners: true,
  isNetworkingOpen: true,
  isHiring: true,
  businessSlogan: true,
  openPositions: true,
  hiringRoles: true,
  menuData: true,
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
export type User = typeof users.$inferSelect;
export type UpdateUser = Partial<Omit<User, "id" | "username" | "password">>;

export type InsertBump = z.infer<typeof insertBumpSchema>;
export type Bump = typeof bumps.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;



export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type VerificationCode = typeof verificationCodes.$inferSelect;

export const insertBlockSchema = createInsertSchema(blocks).pick({ blockerId: true, blockedId: true });
export const insertReportSchema = createInsertSchema(reports).pick({ reporterId: true, reportedId: true, reason: true, details: true });
export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
