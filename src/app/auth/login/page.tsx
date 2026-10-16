'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Scale,
  Building2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

function LoginForm() {
  const { language, t } = useLanguage();
  const { signInWithEmail, signInWithGoogle, isSupabaseConnected } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('next') || '/dashboard';
  const urlError = searchParams.get('error');
  const noticeParam = searchParams.get('notice');
  const authRequiredNotice = noticeParam === 'auth_required' || urlError === 'auth_required';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    urlError === 'oauth_failed'
      ? (language === 'bn' ? 'Google সাইন-ইন প্রক্রিয়া ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Google OAuth sign-in failed. Please try again.')
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে ইউজার আইডি বা ইমেইল প্রদান করুন।'
          : 'Please enter your User ID or email.'
      );
      setLoading(false);
      return;
    }

    if (!password) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।'
          : 'Please enter your password.'
      );
      setLoading(false);
      return;
    }

    try {
      // Authenticate via Supabase Auth (with automatic local credentials fallback)
      const res = await signInWithEmail(cleanIdentifier, password);

      if (!res.success) {
        setErrorMsg(res.error || (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে। ইমেইল ও পাসওয়ার্ড যাচাই করুন।' : 'Login failed. Please verify your credentials.'));
        setLoading(false);
        return;
      }

      router.push(redirectUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle(redirectUrl);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in error');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'লগইন করুন' : 'Sign In to CHECK_&_BUY'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {language === 'bn'
              ? 'নির্ধারিত আইডি বা ইমেইল ও পাসওয়ার্ড দিয়ে আপনার অ্যাকাউন্টে প্রবেশ করুন'
              : 'Sign in with your verified credentials or Google to access your dashboard'}
          </p>
        </div>

        {/* Notice for Unauthenticated Users Redirected from Protected Pages */}
        {authRequiredNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">
                  {language === 'bn'
                    ? 'এই পেজে প্রবেশ করতে অনুগ্রহ করে প্রথমে লগইন করুন বা অ্যাকাউন্ট তৈরি করুন।'
                    : 'Please log in or create an account to access this page.'}
                </p>
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                  {language === 'bn'
                    ? 'জমি অনুসন্ধান, ঝুঁকি স্ক্রিনার, দলিল ভল্ট ও ড্যাশবোর্ডের মতো সংরক্ষিত ফিচারগুলো ব্যবহারের জন্য সাইন ইন করুন।'
                    : 'Authentication is required to view land records, run risk checks, and access your dashboard.'}
                </p>
              </div>
            </div>
            <div className="pt-1 flex items-center justify-between border-t border-amber-200/60 text-[11px]">
              <span className="text-amber-800 font-medium">
                {language === 'bn' ? 'অ্যাকাউন্ট নেই?' : "Don't have an account?"}
              </span>
              <Link
                href={`/register?next=${encodeURIComponent(redirectUrl)}`}
                className="font-bold text-emerald-800 underline hover:text-emerald-950"
              >
                {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)' : 'Create an Account (Sign Up)'}
              </Link>
            </div>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="space-y-3">
          <button
            type="button"
            id="login-google-oauth-btn"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {googleLoading
                ? (language === 'bn' ? 'Google সংযোগ করা হচ্ছে...' : 'Connecting Google...')
                : (language === 'bn' ? 'Google দিয়ে চালিয়ে যান' : 'Continue with Google')}
            </span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute">
              {language === 'bn' ? 'অথবা ইমেইল দিয়ে' : 'or with email'}
            </span>
          </div>
        </div>

        {/* Dedicated Staff Login Navigation Banner */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{language === 'bn' ? 'সরকারি কর্মকর্তা ও স্টাফ পোর্টাল' : 'Staff Login Portals'}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">GovTech</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/officer/login"
              id="goto-officer-login-btn"
              className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-teal-50 text-slate-800 font-bold border border-teal-200 shadow-2xs transition-all text-center flex items-center justify-center gap-1.5 text-[11px]"
            >
              <Scale className="w-3 h-3 text-teal-700" />
              <span>{language === 'bn' ? 'ভূমি কর্মকর্তা' : 'Land Officer'}</span>
            </Link>
            <Link
              href="/admin/login"
              id="goto-admin-login-btn"
              className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-300 shadow-2xs transition-all text-center flex items-center justify-center gap-1.5 text-[11px]"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{language === 'bn' ? 'গভটেক অ্যাডমিন' : 'GovTech Admin'}</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{errorMsg}</div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 font-bold hover:underline cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'ইমেইল বা ইউজার আইডি' : 'Email or User ID'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-identifier-input"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="citizen@example.com"
                required
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">
                {t.authPassword}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-11 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
              <button
                type="button"
                id="toggle-login-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
          >
            <span>
              {loading
                ? (language === 'bn' ? 'লগইন হচ্ছে...' : 'Signing in...')
                : (language === 'bn' ? 'লগইন করুন' : 'Sign In')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>{language === 'bn' ? 'অ্যাকাউন্ট নেই? ' : "Don't have an account? "}</span>
          <Link
            href={`/register?next=${encodeURIComponent(redirectUrl)}`}
            className="font-bold text-emerald-700 hover:underline"
          >
            {language === 'bn' ? 'রেজিস্ট্রেশন করুন' : 'Sign Up'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20 text-xs text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
