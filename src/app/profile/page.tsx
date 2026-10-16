'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { dataStore } from '@/lib/data-store';
import { formatDate } from '@/lib/bangla-utils';
import {
  User,
  Globe,
  Clock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function ProfilePage() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, setCurrentUser } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const verifications = dataStore.getVerifications();
  const documents = dataStore.getDocuments();

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const cleanName = fullName.trim();
    if (!cleanName) {
      setErrorMsg(language === 'bn' ? 'পুরো নাম খালি রাখা যাবে না।' : 'Full name cannot be empty.');
      setSaving(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            phone: phone.trim() || undefined,
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setSaving(false);
          return;
        }
      }

      // Update local profile state
      if (user) {
        const updated = {
          ...user,
          fullName: cleanName,
          phone: phone.trim() || undefined,
        };
        setCurrentUser(updated);
      }

      setSuccessMsg(
        language === 'bn'
          ? 'প্রোফাইলের তথ্য সফলভাবে সংরক্ষিত হয়েছে।'
          : 'Profile information updated successfully.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {language === 'bn' ? 'লগইন প্রয়োজন' : 'Authentication Required'}
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          {language === 'bn'
            ? 'আপনার প্রোফাইল তথ্য দেখতে অনুগ্রহ করে প্রথমে লগইন করুন।'
            : 'Please sign in to view and manage your profile details.'}
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
        >
          <span>{language === 'bn' ? 'লগইন পেজে যান' : 'Go to Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.navProfile}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {language === 'bn' ? 'ব্যবহারকারীর তথ্য ও সেটিংস' : 'Citizen Profile & Account Preferences'}
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
              <User className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user.fullName || 'Citizen User'}</h2>
              <p className="text-xs text-slate-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Role: {user.role}
                </span>
                <span className="text-[11px] text-slate-400">
                  Joined: {formatDate(user.createdAt, language)}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  Status: Active
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Update Profile Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {language === 'bn' ? 'প্রোফাইল তথ্য আপডেট' : 'Update Profile Information'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'পুরো নাম' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'ফোন নম্বর (ঐচ্ছিক)' : 'Phone Number (Optional)'}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1712-345678"
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'ইমেইল ঠিকানা (পরিবর্তনযোগ্য নয়)' : 'Email Address (Read-only)'}
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'অ্যাকাউন্ট আইডি' : 'Account ID'}
              </label>
              <input
                type="text"
                value={user.id}
                disabled
                className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-[11px] cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes')}</span>
          </button>
        </form>

        {/* Language Preference */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'ভাষা পছন্দ (Language Preference)' : 'Language Preference'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              English (Default)
            </button>
            <button
              onClick={() => setLanguage('bn')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                language === 'bn'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              বাংলা (Bangla Unicode)
            </button>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Saved Reports</span>
            <span className="text-base font-bold text-slate-900 mt-1 block">
              {verifications.length}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Uploaded Documents</span>
            <span className="text-base font-bold text-slate-900 mt-1 block">
              {documents.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
