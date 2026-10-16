'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(cleanEmail);

      if (!res.success) {
        setErrorMsg(res.error || (language === 'bn' ? 'পাসওয়ার্ড রিসেট লিংক পাঠাতে ব্যর্থ হয়েছে।' : 'Failed to send password reset email.'));
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-emerald-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {language === 'bn' ? 'রিসেট লিংক পাঠানো হয়েছে' : 'Password Reset Link Sent'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'bn'
                ? `যদি ${email} ঠিকানায় একটি অ্যাকাউন্ট নিবন্ধিত থাকে, তবে একটি পাসওয়ার্ড রিসেট লিংক আপনার ইনবক্সে পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইমেইল চেক করুন।`
                : `If an account exists for ${email}, a password reset link has been dispatched to your inbox. Please check your email to reset your password.`}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'bn' ? 'লগইন পেজে ফিরুন' : 'Back to Login'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        {/* Back Link */}
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'লগইনে ফিরুন' : 'Back to Login'}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {language === 'bn'
              ? 'আপনার নিবন্ধিত ইমেইল ঠিকানা প্রবেশ করান। আমরা আপনাকে একটি পাসওয়ার্ড রিসেট লিংক পাঠাব।'
              : 'Enter your registered email address and we will send you a password reset link.'}
          </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'নিবন্ধিত ইমেইল ঠিকানা' : 'Registered Email Address'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="forgot-password-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                required
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            id="forgot-password-submit-btn"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
          >
            <span>
              {loading
                ? (language === 'bn' ? 'লিংক পাঠানো হচ্ছে...' : 'Sending Link...')
                : (language === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
