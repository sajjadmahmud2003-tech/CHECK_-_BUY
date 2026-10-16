'use client';

/**
 * CHECK_&_BUY — Admin Control Console
 *
 * SECURITY DISCLOSURE (IMPORTANT — READ BEFORE DEPLOYMENT)
 * =========================================================
 * This application is a DEMO / HACKATHON PROTOTYPE.
 * Authorization is implemented entirely on the CLIENT side using React state
 * and localStorage. There is NO real backend authentication server.
 *
 * What this means:
 *  • The "Admin" persona is switched by calling quickDemoLogin('admin') which
 *    sets a UserProfile object in React state and localStorage. Any user who
 *    knows this call can elevate themselves in the browser.
 *  • The isAdmin flag is derived from client-side state — it is NOT verified
 *    by a signed server session, JWT, or cryptographic token.
 *  • API routes (/api/search, /api/verify) perform no authentication checks.
 *  • The dataStore singleton lives in Next.js server memory — it is NOT a
 *    real persistent database and resets on every cold start.
 *  • Refreshing the page restores the last localStorage user.
 *
 * For a production system you would need:
 *  ✅ Server-side session verification (e.g., Supabase Auth, NextAuth.js)
 *  ✅ Row-level security on every database table
 *  ✅ Middleware that validates the JWT on every API and page request
 *  ✅ Rate limiting, CSRF protection, audit logging to an append-only store
 *
 * The demo persona switch is intentionally visible and labeled so that
 * hackathon judges can evaluate all features. Remove before any deployment.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { dataStore } from '@/lib/data-store';
import { LandRecord, UserProfile } from '@/types';
import RiskBadge from '@/components/RiskBadge';
import { toBanglaNumber, formatDate } from '@/lib/bangla-utils';
import {
  Trash2,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  UserCheck,
  Info,
  UserPlus,
  BadgeCheck,
  Scale,
  ShieldCheck,
  Building2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

// ── Access-Denied Screen on Citizen View ─────────────────────────────────────
function AdminAccessDenied({
  language,
  user,
}: {
  language: string;
  user: { fullName?: string; role?: string } | null;
}) {
  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Lock Icon + Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center shadow-xs">
            <Lock className="w-8 h-8 text-amber-700" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {language === 'bn' ? 'অ্যাডমিন অনুমতি প্রয়োজন' : 'Administrator Access Required'}
          </h1>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed">
            {language === 'bn'
              ? 'এই অ্যাডমিন প্যানেলটি শুধুমাত্র অনুমোদিত GovTech সিস্টেম অ্যাডমিনদের জন্য সংরক্ষিত।'
              : 'This control console is reserved for GovTech system administrators only.'}
          </p>
        </div>

        {/* Current Role Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'bn' ? 'আপনার বর্তমান পরিচয়' : 'Your Current Session'}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">{language === 'bn' ? 'নাম:' : 'Name:'}</span>
            <span className="text-slate-900 font-medium">{user?.fullName || 'Guest / Citizen'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-600">{language === 'bn' ? 'ভূমিকা:' : 'Role:'}</span>
            <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
              {user?.role || 'citizen'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {language === 'bn'
              ? 'সিটিজেন বা সাধারণ ব্যবহারকারী অ্যাকাউন্টে এই কনসোলে প্রবেশাধিকার নেই।'
              : 'Citizen accounts do not have administrative privileges on this console.'}
          </p>
        </div>

        {/* Dedicated Staff Authentication Section */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'অফিসিয়াল স্টাফ প্রবেশদ্বার' : 'Official Staff Authentication'}</span>
            </div>
            <h2 className="text-lg font-black text-slate-900">
              {language === 'bn' ? 'কর্মকর্তা ও অ্যাডমিন লগইন' : 'Staff Login Options'}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {language === 'bn'
                ? 'এই বিকল্পগুলো শুধুমাত্র স্টাফ প্রমাণীকরণ (Authentication)-এর জন্য। কোনো সর্বসাধারণের নিবন্ধনের জন্য নয়।'
                : 'These options are strictly for staff authentication, not public staff registration.'}
            </p>
          </div>

          {/* Exactly Two Staff Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Land Officer Login */}
            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-300 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
                  <Scale className="w-5 h-5 text-teal-100" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? '১. ভূমি কর্মকর্তা লগইন' : '1. Land Officer Login'}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'bn'
                    ? 'ভূমি কর্মকর্তা ও আইন বিশেষজ্ঞদের ডেডিকেটেড লগইন পেজ ও দলিল ডাউনলোড পোর্টাল।'
                    : 'Dedicated portal for Land Officers and Legal Consultants with verified staff IDs.'}
                </p>
              </div>
              <Link
                href="/officer/login"
                id="admin-citizen-to-officer-login-btn"
                className="w-full py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'bn' ? 'ভূমি কর্মকর্তা লগইন' : 'Land Officer Login'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 2. GovTech Admin Login */}
            <div className="p-4 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100/90 hover:border-slate-400 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? '২. গভটেক অ্যাডমিন লগইন' : '2. GovTech Admin Login'}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'bn'
                    ? 'সিস্টেম অ্যাডমিনিস্ট্রেটরদের ডেডিকেটেড লগইন পেজ, ভূমি রেকর্ড ও কর্মী ব্যবস্থাপনা।'
                    : 'Dedicated portal for GovTech Administrators managing records, audits, and staff.'}
                </p>
              </div>
              <Link
                href="/admin/login"
                id="admin-citizen-to-admin-login-btn"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'bn' ? 'গভটেক অ্যাডমিন লগইন' : 'GovTech Admin Login'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Clear Navigation Back to Citizen View / Dashboard */}
        <div className="flex items-center justify-center pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নাগরিক ড্যাশবোর্ডে ফিরে যান' : 'Return to Citizen Dashboard'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Dismissable Security Banner ─────────────────────────────────────────────
function DemoSecurityBanner({ language }: { language: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex flex-col sm:flex-row items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-bold text-rose-800">
          {language === 'bn' ? '⚠️ ডেমো মোড — ক্লায়েন্ট-সাইড অনুমোদন' : '⚠️ Demo Mode — Client-Side Authorization Only'}
        </p>
        <p className="text-xs text-rose-700 leading-relaxed">
          {language === 'bn'
            ? 'এই প্যানেলের "অ্যাডমিন" অনুমতি শুধুমাত্র ব্রাউজার স্টেট (localStorage) দ্বারা নিয়ন্ত্রিত। কোনো সার্ভার-সাইড JWT যাচাই নেই।'
            : 'Admin access is controlled solely by browser state (localStorage). There is no server-side JWT or session verification. Must be secured before any real deployment.'}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-rose-400 hover:text-rose-700 text-xs font-bold shrink-0 cursor-pointer"
        aria-label="Dismiss"
      >
        ✕ Dismiss
      </button>
    </div>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, note, color }: {
  label: string; value: number | string; note: string; color: 'slate' | 'emerald' | 'sky';
}) {
  const cls = { slate: 'text-slate-900', emerald: 'text-emerald-800', sky: 'text-sky-800' };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">{label}</span>
      <div className={`text-3xl font-black ${cls[color]}`}>{value}</div>
      <p className="text-[10px] text-slate-400">{note}</p>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { language, t } = useLanguage();
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'records' | 'logs' | 'staff'>('records');
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/register', {
        headers: { 'x-user-id': user.id },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.staff) setStaffList(data.staff);
        })
        .catch(() => {});
    }
  }, [user]);

  // New record form
  const [newUpazila, setNewUpazila] = useState('Mohammadpur');
  const [newMouza, setNewMouza] = useState('Jafrabad');
  const [newDagNo, setNewDagNo] = useState('512');
  const [newKhatianNo, setNewKhatianNo] = useState('204');
  const [newArea, setNewArea] = useState<number>(8.5);
  const [newOwner, setNewOwner] = useState('Habibur Rahman');

  // Guard: if user is not admin, show AdminAccessDenied with Staff Login options
  if (!isAdmin) return <AdminAccessDenied language={language} user={user} />;

  const records = dataStore.getRecords();
  const logs = dataStore.getAuditLogs();
  const documents = dataStore.getDocuments();

  const handleDelete = (id: string) => {
    if (confirm('Delete this demo record? This only affects in-memory data and resets on server restart.')) {
      dataStore.deleteRecord(id);
      setActiveTab('records');
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRec: LandRecord = {
      id: `rec-${Date.now()}`,
      division: 'Dhaka',
      divisionBn: 'ঢাকা',
      district: 'Dhaka',
      districtBn: 'ঢাকা',
      upazila: newUpazila,
      upazilaBn: newUpazila,
      mouza: newMouza,
      mouzaBn: newMouza,
      jlNumber: '14',
      khatianNo: newKhatianNo,
      dagNo: newDagNo,
      landClass: 'Homestead',
      landClassBn: 'বাস্তু ভিটি',
      areaDecimals: newArea,
      currentSurvey: 'BS',
      isDemoData: true,
      isVerifiedByAuthority: false,
      sourceProvenance: 'GovTech Admin Console (Injected Simulation)',
      hasCaveatOrDispute: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owners: [
        {
          id: `own-${Date.now()}`,
          ownerName: newOwner,
          ownerNameBn: newOwner,
          fatherOrHusbandName: 'Late M. Rahman',
          sharePortion: '1.00 (১৬ আনা)',
          acquisitionType: 'Purchase (Kabala)',
          recordedDate: '2020-01-15',
        },
      ],
      surveys: [
        {
          surveyType: 'CS',
          year: 1940,
          khatianNo: '12',
          dagNo: '400',
          recordedOwner: 'Late M. Rahman',
          areaDecimals: newArea,
          landClass: 'Homestead',
          verifiedStatus: 'consistent',
        },
        {
          surveyType: 'RS',
          year: 1980,
          khatianNo: '88',
          dagNo: newDagNo,
          recordedOwner: 'Late M. Rahman',
          areaDecimals: newArea,
          landClass: 'Homestead',
          verifiedStatus: 'consistent',
        },
        {
          surveyType: 'BS',
          year: 2010,
          khatianNo: newKhatianNo,
          dagNo: newDagNo,
          recordedOwner: newOwner,
          areaDecimals: newArea,
          landClass: 'Homestead',
          verifiedStatus: 'consistent',
        },
      ],
      mutation: {
        id: `mut-${Date.now()}`,
        caseNo: `MUT-${Date.now().toString().slice(-4)}`,
        mutationKhatianNo: `${newKhatianNo}/1`,
        applicantName: newOwner,
        status: 'approved',
        approvalDate: '2020-04-10',
        acLandOffice: 'Mohammadpur Circle AC Land',
        lastTaxPaidYear: 2024,
      },
    };

    dataStore.addRecord(newRec);
    setShowAddModal(false);
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>GovTech Control Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.adminTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">{t.adminSubtitle}</p>
        </div>

        <div className="flex items-center gap-2.5 self-start flex-wrap">
          <Link
            href="/admin/register"
            id="admin-register-staff-btn"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'bn' ? 'কর্মকর্তা ও অ্যাডমিন নিবন্ধন' : 'Staff Registration'}</span>
          </Link>

          <button
            id="admin-add-record-btn"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.adminAddRecord}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label={t.adminTotalRecords}
          value={language === 'bn' ? toBanglaNumber(records.length) : records.length}
          note={language === 'bn' ? 'সিমুলেটেড ডেটা — স্থায়ী নয়' : 'Simulated — resets on server restart'}
          color="slate"
        />
        <MetricCard
          label={t.adminTotalAuditLogs}
          value={language === 'bn' ? toBanglaNumber(logs.length) : logs.length}
          note={language === 'bn' ? 'ইন-মেমোরি লগ' : 'In-memory — not persisted'}
          color="emerald"
        />
        <MetricCard
          label={language === 'bn' ? 'প্রসেসড ডকুমেন্ট' : 'Processed Documents'}
          value={language === 'bn'
            ? toBanglaNumber(documents.length > 0 ? documents.length : 2)
            : documents.length > 0 ? documents.length : 2}
          note={language === 'bn' ? 'OCR আপলোড সেশন' : 'OCR upload sessions'}
          color="sky"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-bold">
        {(['records', 'logs', 'staff'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer capitalize ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab === 'records'
              ? t.adminTabRecords
              : tab === 'logs'
              ? t.adminTabLogs
              : language === 'bn'
              ? 'কর্মকর্তা ও অ্যাডমিন'
              : 'Staff Accounts'}
          </button>
        ))}
      </div>

      {/* Tab: Records */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[640px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Location / Mouza</th>
                <th className="py-3 px-3">Dag & Khatian</th>
                <th className="py-3 px-3">Recorded Area</th>
                <th className="py-3 px-3">Owner(s)</th>
                <th className="py-3 px-3">Mutation</th>
                <th className="py-3 px-3">Risk Flag</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const isClean = !r.hasCaveatOrDispute && r.mutation?.status === 'approved';
                const riskLevel = isClean ? 'low' : r.hasCaveatOrDispute ? 'high' : 'medium';
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{r.mouza}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {r.upazila}, {r.district}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      Dag #{r.dagNo} (Khatian #{r.khatianNo})
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-800">
                      {r.areaDecimals} dec
                    </td>
                    <td className="py-3.5 px-3">{r.owners[0]?.ownerName}</td>
                    <td className="py-3.5 px-3 uppercase text-[11px] font-semibold text-slate-700">
                      {r.mutation?.status || 'None'}
                    </td>
                    <td className="py-3.5 px-3">
                      <RiskBadge severity={riskLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 rounded cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[560px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Resource</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">{formatDate(log.timestamp, 'en')}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 text-[11px] whitespace-nowrap">{log.action}</td>
                  <td className="py-3 px-3 uppercase text-[10px] text-slate-500 font-semibold whitespace-nowrap">{log.resourceType}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.details}>{log.details}</td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">{log.userEmail || 'system'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {logs.length === 0 && <div className="py-16 text-center text-slate-400 text-sm">No audit logs yet.</div>}
        </div>
      )}

      {/* Tab: Staff & Officer Accounts */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'অনুমোদিত ভূমি কর্মকর্তা ও গভটেক অ্যাডমিন তালিকা' : 'Authorized Land Officers & GovTech Admins'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'bn' ? 'নতুন কর্মকর্তা নিয়োগ বা অ্যাডমিন তৈরির জন্য নিবন্ধন পেজ ব্যবহার করুন।' : 'Use the GovTech Admin registration interface to provision new staff credentials.'}
              </p>
            </div>
            <Link
              href="/admin/register"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 self-start shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'নতুন কর্মকর্তা নিবন্ধন' : 'Register New Staff'}</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[560px]">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-3">Role / Position</th>
                  <th className="py-3 px-3">Full Name & Email</th>
                  <th className="py-3 px-3">Provisioned Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{s.id}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          s.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.role === 'admin' ? 'GovTech Admin' : 'Land Officer'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{s.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                      {formatDate(s.createdAt, language)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No staff accounts found. Click &quot;Register New Staff&quot; to provision accounts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Record Modal — closes on backdrop click */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'bn' ? 'নতুন নমুনা রেকর্ড যোগ করুন' : 'Add Simulated Land Record'}
                </h3>
                <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                  {language === 'bn' ? '⚠️ ইন-মেমোরি ডেটা — সার্ভার রিস্টার্টে মুছে যাবে।' : '⚠️ In-memory demo data — resets on server restart.'}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer p-1 flex-shrink-0" aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'উপজেলা' : 'Upazila'}
                  </label>
                  <input type="text" value={newUpazila} onChange={(e) => setNewUpazila(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'মৌজা' : 'Mouza'}
                  </label>
                  <input type="text" value={newMouza} onChange={(e) => setNewMouza(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'bn' ? 'দাগ নং' : 'Dag No'}</label>
                  <input type="text" value={newDagNo} onChange={(e) => setNewDagNo(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'bn' ? 'খতিয়ান নং' : 'Khatian No'}</label>
                  <input type="text" value={newKhatianNo} onChange={(e) => setNewKhatianNo(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden" required />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{language === 'bn' ? 'ক্ষেত্রফল (শতক)' : 'Area (Dec)'}</label>
                  <input type="number" step="0.1" min="0.1" value={newArea} onChange={(e) => setNewArea(parseFloat(e.target.value))}
                    className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden" required />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'bn' ? 'মালিকের নাম' : 'Recorded Owner Name'}
                </label>
                <input type="text" value={newOwner} onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden" required />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors">
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors">
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
