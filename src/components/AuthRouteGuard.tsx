'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { isPublicPath, getSafeRedirectUrl } from '@/lib/auth-routes';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

export default function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublic = isPublicPath(pathname || '/');

  // Trigger redirection when unauthenticated on a protected route, or when already authenticated on login/register
  useEffect(() => {
    if (!mounted || loading) return;

    // 1. If user is already authenticated and visits login/register, redirect them to dashboard/next
    const isAuthPortal =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/signup' ||
      pathname === '/auth/login' ||
      pathname === '/auth/register';

    if (user && isAuthPortal) {
      const nextParam = searchParams?.get('next') || searchParams?.get('redirect');
      const safeTarget = getSafeRedirectUrl(nextParam, user.role);
      router.replace(safeTarget);
      return;
    }

    // 2. If unauthenticated on a protected route, redirect to login
    if (!isPublic && !user) {
      const queryString = searchParams?.toString();
      const currentFullPath = pathname + (queryString ? `?${queryString}` : '');
      const safeTarget = getSafeRedirectUrl(currentFullPath, 'citizen');
      const redirectUrl = `/login?next=${encodeURIComponent(safeTarget)}&notice=auth_required`;
      router.replace(redirectUrl);
    }
  }, [mounted, loading, isPublic, user, pathname, searchParams, router]);

  // Public pages are always rendered immediately
  if (isPublic) {
    return <>{children}</>;
  }

  // 1. Session verification loading state — prevents content flashing
  if (!mounted || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] py-16 px-4 bg-slate-50/60">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'bn' ? 'সেশন যাচাই করা হচ্ছে...' : 'Verifying Secure Session...'}
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              {language === 'bn'
                ? 'CHECK_&_BUY সিস্টেমে আপনার অনুমতি ও নিরাপত্তা স্থিতি নিশ্চিত করা হচ্ছে'
                : 'Confirming your authentication state and security clearance with CHECK_&_BUY'}
            </p>
          </div>
          <div className="w-24 h-1 bg-emerald-500/20 rounded-full mx-auto overflow-hidden">
            <div className="w-1/2 h-full bg-emerald-600 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated access on protected pages: Redirecting & access-required view
  if (!user) {
    const queryString = searchParams?.toString();
    const currentFullPath = pathname + (queryString ? `?${queryString}` : '');
    const safeTarget = getSafeRedirectUrl(currentFullPath, 'citizen');
    const loginTarget = `/login?next=${encodeURIComponent(safeTarget)}&notice=auth_required`;
    const signupTarget = `/register?next=${encodeURIComponent(safeTarget)}`;

    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh] py-16 px-4 sm:px-6 bg-slate-50/70">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-amber-200 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              {language === 'bn' ? 'প্রবেশাধিকার সংরক্ষিত' : 'Authentication Required'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {language === 'bn'
                ? 'এই পেজে প্রবেশ করতে অনুগ্রহ করে প্রথমে লগইন করুন বা অ্যাকাউন্ট তৈরি করুন।'
                : 'Please log in or create an account to access this page.'}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {language === 'bn'
                ? 'জমি অনুসন্ধান, যাচাইকরণ, দলিল ভল্ট এবং ড্যাশবোর্ড ব্যবহারের জন্য সক্রিয় নাগরিক বা সরকারি কর্মকর্তা অ্যাকাউন্ট প্রয়োজন।'
                : 'Land search results, title verification, document archives, and dashboard records require an authenticated citizen or staff account.'}
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href={loginTarget}
              id="guard-redirect-login-btn"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{language === 'bn' ? 'লগইন করুন (Sign In)' : 'Sign In with Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={signupTarget}
              id="guard-redirect-signup-btn"
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)' : 'Create New Account (Sign Up)'}</span>
            </Link>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <Link href="/" className="text-slate-500 hover:text-emerald-700 font-medium underline">
              {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Return to Homepage'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Role-based sub-guards for staff sections
  if (pathname.startsWith('/officer') && pathname !== '/officer/login' && user.role !== 'officer') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {language === 'bn' ? 'ভূমি কর্মকর্তা পোর্টাল — অনুমতি নেই' : 'Land Officer Section — Access Restricted'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {language === 'bn'
            ? 'এই শাখাটি শুধুমাত্র যাচাইকৃত ভূমি কর্মকর্তাদের জন্য সংরক্ষিত। নাগরিক ক্রেতা অ্যাকাউন্টের এই বিভাগে প্রবেশের অনুমতি নেই।'
            : 'This section is strictly restricted to verified Land Officers. Citizen Buyer accounts cannot access officer records.'}
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            <span>{language === 'bn' ? 'নাগরিক ড্যাশবোর্ডে ফিরে যান' : 'Back to Citizen Dashboard'}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {language === 'bn' ? 'গভটেক অ্যাডমিন কনসোল — অনুমতি নেই' : 'GovTech Admin Panel — Access Restricted'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {language === 'bn'
            ? 'এই কনসোলটি শুধুমাত্র অনুমোদিত গভটেক সিস্টেম প্রশাসকদের জন্য সংরক্ষিত।'
            : 'This control panel is restricted to authorized GovTech Administrators.'}
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            <span>{language === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated and authorized: render protected page contents
  return <>{children}</>;
}
