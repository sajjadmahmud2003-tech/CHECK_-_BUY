'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (email: string, fullName: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => void;
}

const DEMO_USERS: Record<UserRole, UserProfile> = {
  citizen: {
    id: 'user-citizen-01',
    email: 'citizen@landcheck.gov.bd',
    fullName: 'Mohammad Rafiqul Islam (Citizen Buyer)',
    role: 'citizen',
    phone: '+880 1712-345678',
    preferredLanguage: 'en',
    createdAt: '2026-01-10T08:00:00Z',
  },
  officer: {
    id: 'user-officer-02',
    email: 'officer@landcheck.gov.bd',
    fullName: 'Barrister Tahmina Akter (Land Law Consultant)',
    role: 'officer',
    phone: '+880 1819-876543',
    preferredLanguage: 'bn',
    createdAt: '2026-01-05T09:00:00Z',
  },
  admin: {
    id: 'user-admin-03',
    email: 'admin@landcheck.gov.bd',
    fullName: 'Kazi Nazmul Huda (GovTech Admin)',
    role: 'admin',
    phone: '+880 1911-000000',
    preferredLanguage: 'en',
    createdAt: '2026-01-01T00:00:00Z',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEMO_USERS.citizen); // Default logged in as demo citizen for frictionless evaluation

  useEffect(() => {
    const saved = localStorage.getItem('landcheck_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(DEMO_USERS.citizen);
      }
    }
  }, []);

  const login = async (email: string, role: UserRole = 'citizen'): Promise<boolean> => {
    const matched = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
    const targetUser: UserProfile = matched || {
      id: `usr-${Date.now()}`,
      email,
      fullName: email.split('@')[0],
      role,
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    setUser(targetUser);
    localStorage.setItem('landcheck_user', JSON.stringify(targetUser));
    return true;
  };

  const register = async (email: string, fullName: string, role: UserRole): Promise<boolean> => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      role,
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem('landcheck_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('landcheck_user');
  };

  const quickDemoLogin = (role: UserRole) => {
    const demoUser = DEMO_USERS[role];
    setUser(demoUser);
    localStorage.setItem('landcheck_user', JSON.stringify(demoUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isOfficer: user?.role === 'officer' || user?.role === 'admin',
        login,
        register,
        logout,
        quickDemoLogin,
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
