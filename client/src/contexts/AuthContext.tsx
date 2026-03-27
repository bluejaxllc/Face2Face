import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/lib/api-config";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  age: number;
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
  bumpMessage: string | null;
  isActive: boolean;
  inactiveTimeout: number;
  latitude: number | null;
  longitude: number | null;
  lastLocation: Date;
  profileCompleted: boolean;
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
  gender?: string;
  age?: number;
  selfRating?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const { isLoading, refetch, data: userData } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 0, // Always fetch from network
    queryFn: async ({ queryKey }) => {
      const fullUrl = buildApiUrl(queryKey[0] as string);
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch user data");
      }

      return res.json();
    }
  });

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      refetch(); // Force a refetch of the user data
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
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
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
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
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
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
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

  // Run refetch only once when component mounts
  useEffect(() => {
    // No need to refetch on mount as the initial query will handle it
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
