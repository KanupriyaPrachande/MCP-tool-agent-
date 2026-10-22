"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  username: string;
  role: "hr" | "manager" | "intern" | string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  apiFetch: (endpoint: string, options?: RequestInit) => Promise<Response>;
  apiUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "sentinel_auth_session";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const DEMO_ACCOUNTS = [
  {
    username: "hr_user",
    password: "demo123",
    role: "hr",
    label: "Human Resources",
    badge: "Full Admin",
    description: "Unrestricted access to all employee salaries, tickets, write approvals & audit log.",
  },
  {
    username: "manager_user",
    password: "demo123",
    role: "manager",
    label: "Engineering Manager",
    badge: "Scoped Access",
    description: "Restricted to Engineering department. Salaries masked with '***'. Tickets visible.",
  },
  {
    username: "intern_user",
    password: "demo123",
    role: "intern",
    label: "Engineering Intern",
    badge: "Read Only Masked",
    description: "Restricted to Engineering. Salaries & emails masked with '***'. No tickets access.",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user session from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        if (parsed?.token && parsed?.username && parsed?.role) {
          setUser(parsed);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  // Protected route check
  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        router.push("/login");
      } else if (user && pathname === "/login") {
        router.push("/workspace");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, error: "Invalid username or password" };
        }
        const errorData = await res.json().catch(() => ({}));
        return { success: false, error: errorData.detail || `Server error (${res.status})` };
      }

      const data = await res.json();
      const authenticatedUser: User = {
        token: data.token,
        role: data.role,
        username: data.username,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      router.push("/workspace");
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error:
          "Can't reach the Sentinel backend. It runs on a free tier and may be waking up. Wait about a minute and try again.",
      };
    }
  };

  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});
      if (user?.token) {
        headers.set("Authorization", `Bearer ${user.token}`);
      }

      const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired or invalid
        logout();
        throw new Error("Session expired. Please log in again.");
      }

      return response;
    },
    [user, logout]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        apiFetch,
        apiUrl: API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}