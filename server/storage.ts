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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bumps: Map<number, Bump>;
  private messages: Map<number, Message>;
  private notifications: Map<number, Notification>;
  
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
    
    // For simplicity in this MVP, we're not doing actual distance calculations
    // or age filtering since we don't store age. In a real app, you would use
    // a proper distance formula and filter by age if needed.
    
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
    
    return filteredUsers;
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
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
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
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
    const notification: Notification = {
      ...insertNotification,
      id,
      timestamp: now,
      read: false,
    };
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

export const storage = new MemStorage();
