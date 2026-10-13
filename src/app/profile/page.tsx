'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { dataStore } from '@/lib/data-store';
import { formatDate } from '@/lib/bangla-utils';
import { User, Globe, Shield, Clock, FileText, ArrowRight } from 'lucide-react';

export default function ProfilePage() {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  const verifications = dataStore.getVerifications();
  const documents = dataStore.getDocuments();

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

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
            <User className="w-8 h-8 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.fullName || 'Citizen User'}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Role: {user?.role}
              </span>
              <span className="text-[11px] text-slate-400">
                Joined: {formatDate(user?.createdAt, language)}
              </span>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="space-y-3">
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
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Saved Reports</span>
            <span className="text-base font-bold text-slate-900 mt-1 block">
              {verifications.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Uploaded Documents</span>
            <span className="text-base font-bold text-slate-900 mt-1 block">
              {documents.length}
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
          >
            {t.navLogout}
          </button>
        </div>
      </div>
    </div>
  );
}
