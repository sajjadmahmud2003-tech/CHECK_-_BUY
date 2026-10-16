'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { UserProfile } from '@/types';
import { formatDate } from '@/lib/bangla-utils';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  BadgeCheck,
} from 'lucide-react';

export default function GovTechAdminRegisterPage() {
  const { language } = useLanguage();
  const { user, isAdmin } = useAuth();

  // Form fields per exact user requirements
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [position, setPosition] = useState<'Land Officer' | 'Admin'>('Land Officer');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);

  // Fetch staff list when authorized
  const fetchStaff = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await fetch('/api/admin/register', {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.staff) {
          setStaffList(data.staff);
        }
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [user]);

  // ── Access Control Gate: Citizens and Land Officers are strictly forbidden ──
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সংরক্ষিত নিবন্ধন পোর্টাল' : 'Access Restricted'}</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'bn' ? 'অ্যাডমিন নিবন্ধন শাখা — প্রবেশাধিকার সংরক্ষিত' : 'GovTech Admin Registration — Access Restricted'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {language === 'bn'
                ? 'এই পেজটি সর্বসাধারণের জন্য উন্মুক্ত নয়। শুধুমাত্র অনুমোদিত গভটেক অ্যাডমিন (GovTech Admin) এই ইন্টারফেসে প্রবেশ করে ভূমি কর্মকর্তা ও নতুন অ্যাডমিন অ্যাকাউন্ট তৈরি করতে পারেন।'
                : 'This registration portal is not publicly accessible. Only authenticated and authorized GovTech Admins can access this interface to provision Land Officer and Admin credentials.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-1.5">
            <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              {language === 'bn' ? 'বর্তমান সেশন' : 'Current Signed-In Session'}
            </div>
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>{user?.fullName || 'Guest / Unauthenticated'}</span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold text-[11px]">
                {user?.role || 'None'}
              </span>
            </div>
            <p className="text-rose-600 text-[11px] font-medium pt-1">
              {user
                ? (language === 'bn' ? '⚠️ আপনার বর্তমান ভূমিকার জন্য এই পেজটি সংরক্ষিত।' : `⚠️ Role '${user.role}' is not authorized to create privileged staff accounts.`)
                : (language === 'bn' ? '⚠️ অনুগ্রহ করে গভটেক অ্যাডমিন হিসেবে সাইন ইন করুন।' : '⚠️ Please sign in with GovTech Admin credentials.')}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/admin/login"
              id="admin-register-access-denied-login-btn"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'bn' ? 'গভটেক অ্যাডমিন হিসেবে সাইন ইন করুন' : 'Sign In as GovTech Admin'}</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
            >
              {language === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Authorized GovTech Admin Registration Form ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Client-Side Field Validations
    if (!id.trim()) {
      setErrorMessage(language === 'bn' ? 'আইডি (ID) প্রদান করা আবশ্যক।' : 'User ID is required.');
      return;
    }

    if (!pass) {
      setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড (Pass) প্রদান করা আবশ্যক।' : 'Pass is required.');
      return;
    }

    if (pass.length < 6) {
      setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters long.');
      return;
    }

    if (pass !== confirmPass) {
      setErrorMessage(language === 'bn' ? 'পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।' : 'Pass and Confirm Pass do not match.');
      return;
    }

    // 2. Submit to Server
    setLoading(true);
    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          id: id.trim(),
          pass,
          confirmPass,
          position,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || (language === 'bn' ? 'অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে।' : 'Account creation failed.'));
      } else {
        setSuccessMessage(
          language === 'bn'
            ? `সফলভাবে "${position}" অ্যাকাউন্ট তৈরি হয়েছে (আইডি: ${id.trim()})। নতুন ব্যবহারকারী এখন লগইন করতে পারবেন।`
            : `Successfully provisioned new ${position} account with ID: '${id.trim()}'. The user can now log in using these credentials.`
        );
        // Reset form
        setId('');
        setPass('');
        setConfirmPass('');
        setPosition('Land Officer');
        fetchStaff();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="text-xs font-semibold text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1.5 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'অ্যাডমিন কনসোলে ফিরুন' : 'Back to Admin Console'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'bn' ? 'গভটেক কর্মকর্তা ও অ্যাডমিন নিবন্ধন' : 'GovTech Admin Registration'}
            </h1>
            <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full uppercase">
              GovTech Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {language === 'bn'
              ? 'ভূমি কর্মকর্তা ও অতিরিক্ত গভটেক অ্যাডমিন অ্যাকাউন্ট তৈরির জন্য অফিসিয়াল সুরক্ষিত ইন্টারফেস।'
              : 'Authorized registration interface for creating Land Officer and GovTech Admin credentials.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
          >
            {language === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Console'}
          </Link>
        </div>
      </div>

      {/* Security Governance Callout */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold">
            {language === 'bn' ? 'নিরাপদ অ্যাকাউন্ট প্রোভিশনিং প্রোটোকল' : 'Secure Staff Provisioning Protocol'}
          </p>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            {language === 'bn'
              ? 'সকল পাসওয়ার্ড সার্ভার প্রান্তে পিবিকেডিএফ-২ (PBKDF2) ক্রিপ্টোগ্রাফিক অ্যালগরিদম ও ইউনিক সল্ট দ্বারা হ্যাশ করা হয়। পাসওয়ার্ড কখনো প্লেইন টেক্সট হিসেবে সংরক্ষিত বা প্রদর্শিত হয় না।'
              : 'All passwords are cryptographically hashed using PBKDF2/SHA-512 with per-user cryptographic salts. Plaintext passwords are never logged or stored.'}
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-3 text-emerald-900 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'bn' ? 'নতুন কর্মকর্তা / অ্যাডমিন অ্যাকাউন্ট নিবন্ধন' : 'Staff Account Registration Form'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {language === 'bn' ? 'ফর্মের সকল তথ্য পূরণ করুন' : 'Fill in all required fields to provision credentials'}
              </p>
            </div>
          </div>
        </div>

        {/* The Exact Form per User Specification */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Field: ID */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="admin-reg-id" className="block font-bold text-slate-800 text-xs">
                ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-reg-id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: officer-dhaka-04 বা admin-ctg-01' : 'e.g. officer-gulshan-01 or admin-audit-02'}
                  required
                  className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {language === 'bn' ? 'ব্যবহারকারীর অনন্য লগইন আইডি। এটি অবশ্যই ইউনিক হতে হবে।' : "The user's unique login ID. Must be unique across the platform."}
              </p>
            </div>

            {/* Field: Pass */}
            <div className="space-y-1.5">
              <label htmlFor="admin-reg-pass" className="block font-bold text-slate-800 text-xs">
                Pass <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-reg-pass"
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {language === 'bn' ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।' : 'Minimum 6 characters.'}
              </p>
            </div>

            {/* Field: Confirm Pass */}
            <div className="space-y-1.5">
              <label htmlFor="admin-reg-confirm-pass" className="block font-bold text-slate-800 text-xs">
                Confirm Pass <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-reg-confirm-pass"
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করতে পুনরায় লিখুন।' : 'Re-enter password to confirm.'}
              </p>
            </div>

            {/* Field: Position (EXACTLY two options: Land Officer, Admin) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="admin-reg-position" className="block font-bold text-slate-800 text-xs">
                Position <span className="text-rose-500">*</span>
              </label>
              <select
                id="admin-reg-position"
                value={position}
                onChange={(e) => setPosition(e.target.value as 'Land Officer' | 'Admin')}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Land Officer">Land Officer</option>
                <option value="Admin">Admin</option>
              </select>
              <p className="text-[10px] text-slate-400">
                {position === 'Land Officer'
                  ? (language === 'bn' ? 'ভূমি কর্মকর্তা হিসেবে অ্যাকাউন্ট তৈরি হবে। এই ব্যবহারকারী সুরক্ষিত দলিল ডাউনলোড ও ভূমি কর্মকর্তা শাখায় প্রবেশ করতে পারবেন।' : 'Creates a Land Officer account with permissions to download protected documents and access the Land Officer Section.')
                  : (language === 'bn' ? 'গভটেক অ্যাডমিন হিসেবে অ্যাকাউন্ট তৈরি হবে। এই ব্যবহারকারী অ্যাডমিন প্যানেল ও অডিট লগে প্রবেশ করতে পারবেন।' : 'Creates a GovTech Admin account with permissions to access the Admin Panel, audit logs, and account registration.')}
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Registering Account...') : (language === 'bn' ? 'অ্যাকাউন্ট নিবন্ধন করুন' : 'Create Staff Account')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Staff Accounts Review */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {language === 'bn' ? 'সিস্টেমের সক্রিয় কর্মকর্তা ও অ্যাডমিন তালিকা' : 'Active Staff & Official Directory'}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {staffList.length} Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[580px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-3">Role / Position</th>
                <th className="py-3 px-3">Full Name & Email</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {staff.id}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        staff.role === 'admin'
                          ? 'bg-slate-900 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {staff.role === 'admin' ? 'GovTech Admin' : 'Land Officer'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-slate-800">{staff.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{staff.email}</div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                    {formatDate(staff.createdAt, language)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
