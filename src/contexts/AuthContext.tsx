"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (email: string, role: Role) => void;
  logout: () => void;
  updateProfile: (name: string, profileImage: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem('agoratask_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (email: string, role: Role) => {
    // Determine static user info
    let name = '';
    let profileImage = '';

    if (email === 'admin@gmail.com') {
      name = 'Admin User';
      profileImage = 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin';
    } else if (email === 'provider@gmail.com') {
      name = 'Provider User';
      profileImage = 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider';
    } else if (email === 'customer@gmail.com') {
      name = 'Customer User';
      profileImage = 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer';
    } else {
      name = email.split('@')[0];
      profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
    }

    const newUser: UserProfile = {
      id: Date.now().toString(),
      email,
      role,
      name,
      profileImage,
    };

    setUser(newUser);
    localStorage.setItem('agoratask_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agoratask_user');
  };

  const updateProfile = (name: string, profileImage: string) => {
    if (user) {
      const updatedUser = { ...user, name, profileImage };
      setUser(updatedUser);
      localStorage.setItem('agoratask_user', JSON.stringify(updatedUser));
    }
  };

  if (!isInitialized) return null; // Or a loading spinner

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
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
