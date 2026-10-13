'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, UserCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { language, t } = useLanguage();
  const { login, quickDemoLogin } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email);
    setLoading(false);
    router.push('/dashboard');
  };

  const handleDemoLogin = (role: 'citizen' | 'officer' | 'admin') => {
    quickDemoLogin(role);
    router.push('/dashboard');
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-7 h-7 text-emerald-100" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {t.authSignInTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn'
              ? 'আপনার নাগরিক অ্যাকাউন্টে প্রবেশ করে জমির অনুসন্ধান ও রিপোর্ট সংরক্ষণ করুন'
              : 'Sign in to access your property verifications and saved reports'}
          </p>
        </div>

        {/* Quick Demo Login Preset Buttons for Hackathon Judges */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 space-y-2.5">
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider text-center">
            {t.authQuickDemoLogin}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('citizen')}
              className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-950 font-bold border border-emerald-300 shadow-2xs transition-all text-center cursor-pointer"
            >
              👤 {t.authLoginCitizenBtn}
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-950 font-bold border border-emerald-300 shadow-2xs transition-all text-center cursor-pointer"
            >
              🛡️ {t.authLoginAdminBtn}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t.authEmail}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@landcheck.gov.bd"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{t.authPassword}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? 'Signing in...' : t.navLogin}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          <span>{language === 'bn' ? 'অ্যাকাউন্ট নেই? ' : "Don't have an account? "}</span>
          <Link href="/auth/register" className="font-bold text-emerald-700 hover:underline">
            {t.navRegister}
          </Link>
        </div>
      </div>
    </div>
  );
}
