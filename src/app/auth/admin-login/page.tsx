'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export default function GovTechAdminLoginPage() {
  const { language } = useLanguage();
  const { setCurrentUser } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে গভটেক অ্যাডমিন আইডি বা অফিসিয়াল ইমেইল প্রদান করুন।'
          : 'Please enter your GovTech Admin ID or official email.'
      );
      return;
    }

    if (!password) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড প্রদান করুন।'
          : 'Please enter your admin password.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          password,
          expectedRole: 'admin', // Strictly enforce Admin role on server
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error ||
            (language === 'bn'
              ? 'লগইন ব্যর্থ হয়েছে। আইডি ও পাসওয়ার্ড সঠিক কিনা পরীক্ষা করুন।'
              : 'Authentication failed. Please verify your ID, password, and admin role.')
        );
        setLoading(false);
        return;
      }

      // Synchronize client session state
      if (setCurrentUser) {
        setCurrentUser(data.user, data.token);
      } else {
        localStorage.setItem('landcheck_user', JSON.stringify(data.user));
        document.cookie = `landcheck_session=${encodeURIComponent(data.token || data.user.id)}; path=/; SameSite=Lax`;
      }

      // Navigate to GovTech Admin Console
      router.push('/admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        {/* Navigation Back */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'অ্যাডমিন প্যানেলে ফিরুন' : 'Back to Admin / Citizen View'}</span>
          </Link>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
            <KeyRound className="w-3 h-3 text-slate-600" />
            <span>GovTech Console</span>
          </span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'গভটেক অ্যাডমিন লগইন' : 'GovTech Admin Login'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {language === 'bn'
              ? 'ভূমি ডাটাবেজ, অডিট লগ ও কর্মকর্তা নিবন্ধন ব্যবস্থাপনার জন্য সংরক্ষিত প্রশাসনিক প্রবেশদ্বার।'
              : 'Dedicated administration portal for authorized GovTech Administrators to manage land records, audit logs, and staff.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
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
          {/* Admin ID Field */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              {language === 'bn' ? 'গভটেক অ্যাডমিন আইডি বা অফিসিয়াল ইমেইল' : 'GovTech Admin ID or Official Email'}
              <span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="admin-id-input"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: user-admin-03 বা admin@landcheck.gov.bd'
                    : 'e.g. user-admin-03 or admin@landcheck.gov.bd'
                }
                required
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">
                {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl pl-10 pr-11 py-2.5 text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-hidden transition-all"
              />
              <button
                type="button"
                id="toggle-admin-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="admin-login-submit-btn"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span>{language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Authenticating Administrator...'}</span>
            ) : (
              <>
                <span>{language === 'bn' ? 'অ্যাডমিন কনসোলে প্রবেশ করুন' : 'Sign In as GovTech Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Access Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'bn' ? 'কঠোর ভূমিকা যাচাইকরণ' : 'Strict Role Verification'}</span>
          </div>
          <p className="leading-relaxed">
            {language === 'bn'
              ? 'এই পোর্টালে শুধুমাত্র নিবন্ধিত GovTech "Admin" ভূমিকার অ্যাকাউন্ট দ্বারা প্রবেশাধিকার দেওয়া হয়। সাধারণ নাগরিক এবং ভূমি কর্মকর্তা আইডি এই পোর্টালে প্রত্যাখ্যাত হবে।'
              : 'Login is strictly restricted to verified "Admin" accounts. Citizen Buyers and Land Officers are denied entry.'}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="text-center text-xs space-y-2 pt-2 border-t border-slate-100">
          <div className="text-slate-500">
            {language === 'bn' ? 'ভূমি কর্মকর্তা অ্যাকাউন্ট?' : 'Are you a Land Officer?'}{' '}
            <Link href="/auth/officer-login" className="font-bold text-teal-700 hover:underline">
              {language === 'bn' ? 'ভূমি কর্মকর্তা লগইন' : 'Land Officer Login'}
            </Link>
          </div>
          <div className="text-slate-500">
            {language === 'bn' ? 'নাগরিক ব্যবহারকারী?' : 'Citizen Buyer?'}{' '}
            <Link href="/auth/login" className="font-bold text-emerald-700 hover:underline">
              {language === 'bn' ? 'নাগরিক লগইন পেজ' : 'Citizen Login'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
