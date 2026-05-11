/**
 * Auth Context — React Native
 * Session-based authentication against the Railway backend.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { ApiError } from '@/services/api';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  age: number;
  height?: string | null;
  weight?: string | null;
  selfRating?: number;
  category?: string;
  bio?: string | null;
  datingPreference?: string;
  favoriteColor?: string | null;
  favoriteSong?: string | null;
  fieldOfStudy?: string | null;
  interests?: string | null;
  seeking?: string | null;
  bumpMessage?: string | null;
  isActive?: boolean;
  inactiveTimeout?: number;
  latitude?: string;
  longitude?: string;
  profileCompleted?: boolean;
  profilePhoto?: string | null;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  safetyAcknowledged?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  age: number;
  datingPreference?: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    checkAuth();
    // Auto-logout when any API call returns 401
    api.onAuthFailure(() => {
      console.log('[Auth] Auto-logout triggered by 401');
      setUser(null);
    });
  }, []);

  const checkAuth = async () => {
    try {
      await api.init();
      // If we have a saved session, verify it's still valid
      if (api.isAuthenticated()) {
        const userData = await api.get<User>('/api/auth/me');
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      // Session is stale/invalid — clear it so we get a fresh login
      console.log('[Auth] Session invalid, clearing stored session');
      await api.clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    console.log(`[AuthContext] Attempting login with username length: ${username.length}, password length: ${password.length}`);
    console.log(`[AuthContext] Username specifically: '${username}'`);
    const userData = await api.post<User>('/api/auth/login', { username, password });
    setUser(userData);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const userData = await api.post<User>('/api/auth/register', data);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    await api.clearSession();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const updated = await api.patch<User>('/api/users/profile', data);
    setUser(prev => prev ? { ...prev, ...updated } : updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User, RegisterData };
