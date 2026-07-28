"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { LoginDTO, RegisterDTO, UserResponse } from "@eventure/shared";
import { authApi } from "./api/auth.api";
import { userApi } from "./api/user.api";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  login: (data: LoginDTO) => Promise<UserResponse>;
  register: (data: RegisterDTO) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const profile = await userApi.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser();
  }, []);

  const login = async (data: LoginDTO) => {
    const res = await authApi.login(data);
    setUser(res);
    return res;
  };

  const register = async (data: RegisterDTO) => {
    const res = await authApi.register(data);
    setUser(res);
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
