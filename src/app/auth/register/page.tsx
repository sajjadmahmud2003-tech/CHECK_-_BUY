'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getSafeRedirectUrl } from '@/lib/auth-routes';
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Inbox,
} from 'lucide-react';

function RegisterForm() {
  const { language, t } = useLanguage();
  const { user, signUpWithEmail, signInWithGoogle, isSupabaseConnected } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect') || searchParams.get('next');
  const targetUrl = getSafeRedirectUrl(rawRedirect, user?.role || 'citizen');

  // If already authenticated, redirect away from registration
  React.useEffect(() => {
    if (user) {
      router.replace(targetUrl);
    }
  }, [user, targetUrl, router]);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Email format regex
  const isValidEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    // 1. Validation checks
    if (!cleanName) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার পুরো নাম প্রদান করুন।'
          : 'Please enter your full name.'
      );
      return;
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা (যেমন: user@gmail.com) প্রদান করুন।'
          : 'Please enter a valid email address (e.g. user@gmail.com).'
      );
      return;
    }

    if (password.length < 8) {
      setErrorMsg(
        language === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।'
          : 'Password must be at least 8 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        language === 'bn'
          ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।'
          : 'Password and Confirm Password do not match.'
      );
      return;
    }

    if (!agreeTerms) {
      setErrorMsg(
        language === 'bn'
          ? 'নিবন্ধনের জন্য শর্তাবলী এবং গোপনীয়তা নীতিতে সম্মতি প্রদান করুন।'
          : 'Please agree to the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }

    setLoading(true);

    try {
      const result = await signUpWithEmail(cleanEmail, password, cleanName);

      if (!result.success) {
        setErrorMsg(result.error || (language === 'bn' ? 'নিবন্ধন ব্যর্থ হয়েছে।' : 'Registration failed.'));
        setLoading(false);
        return;
      }

      if (result.requiresEmailVerification) {
        setRegisteredEmail(cleanEmail);
        setVerificationPending(true);
      } else {
        router.push(targetUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle(targetUrl);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in error');
      setGoogleLoading(false);
    }
  };

  // If email verification message is triggered
  if (verificationPending) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-emerald-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <Inbox className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {language === 'bn' ? 'ইমেইল যাচাই করুন' : 'Verify Your Email'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'bn'
                ? `আমরা আপনার ${registeredEmail} ঠিকানায় একটি যাচাইকরণ লিংক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করে অ্যাকাউন্টে প্রবেশ নিশ্চিত করুন।`
                : `We have sent a verification link to ${registeredEmail}. Please check your inbox and verify your email to activate your account.`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left text-xs text-emerald-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{language === 'bn' ? 'পরবর্তী পদক্ষেপ' : 'Next Steps'}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {language === 'bn'
                ? '১. আপনার ইমেইল ইনবক্স বা স্প্যাম ফোল্ডার খুলুন।\n২. Supabase থেকে পাঠানো নিশ্চিতকরণ লিংকে ক্লিক করুন।'
                : '1. Open your email inbox or spam folder.\n2. Click the confirmation link to complete registration.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(targetUrl)}`}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'bn' ? 'লগইন পেজে যান' : 'Go to Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'নাগরিক অ্যাকাউন্ট নিবন্ধন' : 'Create Citizen Account'}
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {language === 'bn'
              ? 'নিবন্ধন করে নিরাপদ ভূমি যাচাই ও ক্রয়পূর্ব স্ক্রিনিং শুরু করুন'
              : 'Create a secure account to inspect land records and check fraud risks'}
          </p>
        </div>

        {/* Google OAuth Button */}
        <div className="space-y-3">
          <button
            type="button"
            id="register-google-oauth-btn"
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

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{errorMsg}</div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-800 font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'পুরো নাম' : 'Full Name'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="register-full-name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: মোহাম্মদ রফিকুল ইসলাম' : 'e.g. Mohammad Rafiqul Islam'}
                required
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="register-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                required
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)' : 'Password (min. 8 characters)'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="register-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-11 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
              <button
                type="button"
                id="toggle-register-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="register-confirm-password-input"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-11 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
              <button
                type="button"
                id="toggle-register-confirm-password-visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Citizen Role Notice (Security requirement: Public cannot register as admin) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-700">
              {language === 'bn' ? 'অ্যাকাউন্ট ভূমিকা: নাগরিক ক্রেতা' : 'Assigned Role: Citizen Buyer'}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
              Citizen
            </span>
          </div>

          {/* Terms and Privacy Checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="agree-terms-checkbox"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-sm text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="agree-terms-checkbox" className="text-[11px] text-slate-600 leading-snug cursor-pointer select-none">
              {language === 'bn' ? (
                <>
                  আমি CHECK_&_BUY-এর{' '}
                  <span className="text-emerald-700 font-semibold underline">ব্যবহারের শর্তাবলী</span> ও{' '}
                  <span className="text-emerald-700 font-semibold underline">গোপনীয়তা নীতি</span> মেনে নিচ্ছি।
                </>
              ) : (
                <>
                  I agree to the{' '}
                  <span className="text-emerald-700 font-semibold underline">Terms of Service</span> and{' '}
                  <span className="text-emerald-700 font-semibold underline">Privacy Policy</span>.
                </>
              )}
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="register-submit-btn"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
          >
            <span>
              {loading
                ? (language === 'bn' ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'Creating Account...')
                : (language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>{language === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? ' : 'Already registered? '}</span>
          <Link
            href={`/login?next=${encodeURIComponent(targetUrl)}`}
            className="font-bold text-emerald-700 hover:underline"
          >
            {language === 'bn' ? 'লগইন করুন' : 'Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20 text-xs text-slate-500">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
