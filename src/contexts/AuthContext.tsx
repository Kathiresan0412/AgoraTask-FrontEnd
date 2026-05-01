"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, LoginPayload, RegisterPayload } from '@/lib/api';

export type Role = 'customer' | 'provider' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  name: string;
  profileImage: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, profileImage: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate from localStorage on mount, then verify token with the server
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem('agoratask_user');
      const token = localStorage.getItem('agoratask_token');

      if (storedUser && token) {
        try {
          // Show cached user immediately for fast UX
          setUser(JSON.parse(storedUser));

          // Verify token is still valid
          const { data } = await authApi.getMe();
          const verifiedUser: UserProfile = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role as Role,
            profileImage: data.profileImage,
          };
          setUser(verifiedUser);
          localStorage.setItem('agoratask_user', JSON.stringify(verifiedUser));
        } catch {
          // Token is expired / invalid — clear everything
          localStorage.removeItem('agoratask_token');
          localStorage.removeItem('agoratask_user');
          setUser(null);
        }
      }
      setIsInitialized(true);
    };
    init();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const { data } = await authApi.login(payload);
      const loggedInUser: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as Role,
        profileImage: data.user.profileImage,
      };
      localStorage.setItem('agoratask_token', data.token);
      localStorage.setItem('agoratask_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const { data } = await authApi.register(payload);
      const newUser: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as Role,
        profileImage: data.user.profileImage,
      };
      localStorage.setItem('agoratask_token', data.token);
      localStorage.setItem('agoratask_user', JSON.stringify(newUser));
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('agoratask_token');
    localStorage.removeItem('agoratask_user');
  }, []);

  const updateProfile = useCallback((name: string, profileImage: string) => {
    if (user) {
      const updatedUser = { ...user, name, profileImage };
      setUser(updatedUser);
      localStorage.setItem('agoratask_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  if (!isInitialized) return null;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
