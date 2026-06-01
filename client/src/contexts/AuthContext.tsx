import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api-config";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  sex: string;
  age: number;
  dateOfBirth: string | null;
  height: string | null;
  weight: string | null;
  selfRating: number;
  category: string;
  bio: string | null;
  datingPreference: string;
  favoriteColor: string | null;
  favoriteSong: string | null;
  fieldOfStudy: string | null;
  interests: string | null;
  seeking: string | null;
  isActive: boolean;
  inactiveTimeout: number;
  latitude: number | null;
  longitude: number | null;
  lastLocation: Date;
  profileCompleted: boolean;
  profilePhoto: string | null;
  phoneNumber: string | null;
  isPhoneVerified: boolean;
  safetyAcknowledged: boolean;

  // Specialized Category Fields
  jobTitle: string | null;
  company: string | null;
  industry: string | null;
  skills: string | null;
  networkingGoal: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  professionalMotto: string | null;
  vibeStatus: string | null;
  currentActivity: string | null;
  icebreaker: string | null;
  weekendVibe: string | null;
  socialBattery: string | null;
  relationshipGoal: string | null;
  datingMode: string | null;
  loveLanguage: string | null;
  mbti: string | null;
  perfectDate: string | null;
  lifestyleCoffee: string | null;
  lifestyleAlcohol: string | null;
  lifestyleSchedule: string | null;
  bannerPhoto: string | null;
  isPublic: boolean;
  businessPhone: string | null;
  businessService: string | null;
  businessNeed: string | null;
  businessPartners: string | null;
  isNetworkingOpen: boolean;
  isHiring: boolean;
  hiringRoles: string | null;
  menuData: string | null;
}


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
}

interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  sex?: string;
  dateOfBirth?: string;
  selfRating?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const hasCheckedIn = useRef(false);

  const { isLoading, refetch, data: user } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30000, // Cache for 30 seconds to avoid excessive network calls
    queryFn: async ({ queryKey }) => {
      const fullUrl = buildApiUrl(queryKey[0] as string);
      try {
        const res = await fetch(fullUrl, {
          credentials: "include",
        });

        if (res.status === 401) {
          return null;
        }

        if (!res.ok) {
          return null;
        }

        return res.json();
      } catch (error) {
        console.error("Auth check failed:", error);
        return null;
      }
    }
  });

  useEffect(() => {
    if (user && !hasCheckedIn.current) {
      hasCheckedIn.current = true;
      apiRequest("POST", "/api/users/check-in")
        .then(res => res.json())
        .then(data => {
           if (data.awarded) {
             toast({
               title: "Daily Check-In!",
               description: `You're on a ${data.streak} day streak! 🔥 (+XP)`,
             });
             refetch();
           }
        })
        .catch(console.error);
    }
  }, [user, refetch, toast]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.firstName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout", {});
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Logout failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<User>) => {
      const res = await apiRequest("PATCH", "/api/users/profile", profileData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Profile update failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateProfile = async (profileData: Partial<User>) => {
    await updateProfileMutation.mutateAsync(profileData);
  };

  // WebSocket real-time connection
  useEffect(() => {
    if (!user) return;

    // Use current host for websocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // For local dev, Vite runs on 5173 but API is on 5000. For production, it's the same host.
    const host = window.location.port === '5173' ? 'localhost:5000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'AUTH', userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_MESSAGE') {
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        } else if (data.type === 'NEW_BUMP') {
          queryClient.invalidateQueries({ queryKey: ["/api/bumps"] });
        } else if (data.type === 'NEW_NOTIFICATION') {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
