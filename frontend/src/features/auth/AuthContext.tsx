import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "../../types/auth";
import { api } from "../../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<User>;
  updateProfile: (payload: any) => Promise<User>;
  refreshProfile: () => Promise<User | undefined>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync theme with user preference
  const applyTheme = (theme: "dark" | "light" | "system") => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  useEffect(() => {
    if (user?.preferences?.theme) {
      applyTheme(user.preferences.theme);
    } else {
      // System default theme check on initial render
      applyTheme("system");
    }
  }, [user?.preferences?.theme]);

  // Restore user session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await api.get<any, { data: User }>("/auth/profile/");
          setUser(response.data);
        } catch (error) {
          console.error("Failed to restore auth session:", error);
          localStorage.clear();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post<any, { data: { access: string; refresh: string; user: User } }>("/auth/login/", {
        username,
        password,
      });
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      setUser(response.data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const response = await api.post<any, { data: { user: User; access: string; refresh: string } }>("/auth/register/", payload);
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      
      // Auto-trigger checkout redirect for paid plan tiers before updating state to avoid React unmount race
      if (payload.plan_tier && payload.plan_tier !== "FREE") {
        try {
          const checkoutResponse = await api.post<any, { data: { checkout_url: string; mode: string } }>(
            "/billing/checkout/",
            { plan: payload.plan_tier },
            {
              headers: {
                Authorization: `Bearer ${response.data.access}`
              }
            }
          );
          if (checkoutResponse.data?.checkout_url) {
            window.location.href = checkoutResponse.data.checkout_url;
            // Return user but do not set it in state immediately since we are navigating away
            return response.data.user;
          }
        } catch (checkoutErr) {
          console.error("Auto checkout redirection failed during registration", checkoutErr);
        }
      }

      setUser(response.data.user);
      return response.data.user;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get<any, { data: User }>("/auth/profile/");
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  const updateProfile = async (payload: any): Promise<User> => {
    const response = await api.put<any, { data: User }>("/auth/profile/", payload);
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/sessions/logout-all/");
    } catch (e) {
      console.warn("Sessions clean call returned exception:", e);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    updateProfile,
    refreshProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
