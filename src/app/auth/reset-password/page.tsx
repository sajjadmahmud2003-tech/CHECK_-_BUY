'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const { updatePassword } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg(
        language === 'bn'
          ? 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।'
          : 'New password must be at least 8 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        language === 'bn'
          ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।'
          : 'Passwords do not match.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await updatePassword(password);

      if (!res.success) {
        setErrorMsg(res.error || (language === 'bn' ? 'পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে।' : 'Failed to update password.'));
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-emerald-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে' : 'Password Successfully Updated'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'bn'
                ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
                : 'Your password has been reset successfully. You can now sign in with your new password.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'bn' ? 'লগইন পেজে যান' : 'Go to Sign In'}</span>
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
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Reset Your Password'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {language === 'bn'
              ? 'আপনার অ্যাকাউন্টের জন্য একটি নতুন নিরাপদ পাসওয়ার্ড প্রদান করুন'
              : 'Enter a new secure password for your CHECK_&_BUY account'}
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
          {/* New Password */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)' : 'New Password (min. 8 characters)'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reset-new-password-input"
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
                id="toggle-reset-password-visibility"
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
              {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="reset-confirm-password-input"
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
                id="toggle-reset-confirm-password-visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="reset-password-submit-btn"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
          >
            <span>
              {loading
                ? (language === 'bn' ? 'আপডেট করা হচ্ছে...' : 'Updating Password...')
                : (language === 'bn' ? 'পাসওয়ার্ড সংরক্ষণ করুন' : 'Update Password')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
