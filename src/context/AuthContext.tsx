'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
  loading: boolean;
  isSupabaseConnected: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (email: string, fullName: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => void;
  setCurrentUser: (user: UserProfile | null, token?: string) => void;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (
    redirectTo?: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
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

// Helper to map Supabase User to CHECK_&_BUY UserProfile
function mapSupabaseUserToProfile(supaUser: any): UserProfile {
  const metadata = supaUser.user_metadata || {};
  return {
    id: supaUser.id,
    email: supaUser.email || '',
    fullName: metadata.full_name || supaUser.email?.split('@')[0] || 'Citizen User',
    role: (metadata.role as UserRole) || 'citizen',
    phone: supaUser.phone || metadata.phone,
    preferredLanguage: metadata.preferred_language || 'en',
    createdAt: supaUser.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize session cookie for server-side auth verification on download requests
  const syncSessionCookie = useCallback((candidateUser: UserProfile | null, token?: string) => {
    if (typeof document !== 'undefined') {
      if (candidateUser?.id) {
        const cookieVal = token || candidateUser.id;
        document.cookie = `landcheck_session=${encodeURIComponent(cookieVal)}; path=/; SameSite=Lax; max-age=604800`;
      } else {
        document.cookie = 'landcheck_session=; path=/; max-age=0; SameSite=Lax';
      }
    }
  }, []);

  const setCurrentUser = useCallback((newUser: UserProfile | null, token?: string) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('landcheck_user', JSON.stringify(newUser));
      syncSessionCookie(newUser, token);
    } else {
      localStorage.removeItem('landcheck_user');
      syncSessionCookie(null);
    }
  }, [syncSessionCookie]);

  // Initial Auth Session Check and Listener Setup
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. If Supabase is active, listen to live auth state
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (isMounted) {
            if (session?.user) {
              const profile = mapSupabaseUserToProfile(session.user);
              setUser(profile);
              syncSessionCookie(profile, session.access_token);
              localStorage.setItem('landcheck_user', JSON.stringify(profile));
            } else {
              // Check fallback local storage if previously signed in locally
              const saved = localStorage.getItem('landcheck_user');
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  // Don't auto-login demo users by default unless explicitly saved
                  setUser(parsed);
                  syncSessionCookie(parsed);
                } catch {
                  setUser(null);
                  syncSessionCookie(null);
                }
              } else {
                setUser(null);
                syncSessionCookie(null);
              }
            }
          }
        } catch {
          if (isMounted) setUser(null);
        } finally {
          if (isMounted) setLoading(false);
        }

        // Real-time Supabase Auth state changes listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              if (session?.user) {
                const profile = mapSupabaseUserToProfile(session.user);
                setUser(profile);
                syncSessionCookie(profile, session.access_token);
                localStorage.setItem('landcheck_user', JSON.stringify(profile));
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              syncSessionCookie(null);
              localStorage.removeItem('landcheck_user');
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } else {
        // 2. Supabase not configured: Check local storage
        const saved = localStorage.getItem('landcheck_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUser(parsed);
            syncSessionCookie(parsed);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [syncSessionCookie]);

  // Supabase: Sign Up with Email and Password
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean }> => {
    if (!isSupabaseConfigured || !supabase) {
      // Local fallback registration
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName, role: 'citizen' }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Registration failed.' };
        }
        setCurrentUser(data.user);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
      }
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'citizen', // Public signups are strictly citizens
          },
          emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If email confirmation is enabled, session will be null
      const requiresEmailVerification = !data.session;
      if (data.user && data.session) {
        const profile = mapSupabaseUserToProfile(data.user);
        setCurrentUser(profile, data.session.access_token);
      }

      return {
        success: true,
        requiresEmailVerification,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  };

  // Supabase: Sign In with Email and Password
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback to local server credentials endpoint
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Invalid ID or password.' };
        }
        setCurrentUser(data.user, data.token);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error' };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        const profile = mapSupabaseUserToProfile(data.user);
        setCurrentUser(profile, data.session.access_token);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  };

  // Supabase: Sign In with Google OAuth
  const signInWithGoogle = async (
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error:
          'Supabase is not configured yet. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable Google OAuth.',
      };
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const targetDestination = redirectTo || '/dashboard';
      const callbackUrl = `${appUrl}/auth/callback?next=${encodeURIComponent(targetDestination)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google OAuth failed to initialize.' };
    }
  };

  // Supabase: Reset Password Request (Forgot Password)
  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not configured yet. Please configure Supabase in .env.local.',
      };
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset email.' };
    }
  };

  // Supabase: Update Password (Reset Password Flow)
  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        error: 'Supabase authentication is not configured yet.',
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore signOut errors
    } finally {
      setCurrentUser(null);
    }
  };

  // Backward compatible login
  const login = async (email: string, role: UserRole = 'citizen'): Promise<boolean> => {
    const matched = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
    const targetUser: UserProfile = matched || {
      id: `usr-${Date.now()}`,
      email,
      fullName: email.split('@')[0],
      role,
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(targetUser);
    return true;
  };

  // Backward compatible register
  const register = async (email: string, fullName: string, role: UserRole): Promise<boolean> => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      role,
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(newUser);
    return true;
  };

  // Quick Demo Login (for offline test evaluation)
  const quickDemoLogin = (role: UserRole) => {
    const demoUser = DEMO_USERS[role];
    setCurrentUser(demoUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isOfficer: user?.role === 'officer',
        loading,
        isSupabaseConnected: isSupabaseConfigured,
        login,
        register,
        logout,
        quickDemoLogin,
        setCurrentUser,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        resetPassword,
        updatePassword,
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
