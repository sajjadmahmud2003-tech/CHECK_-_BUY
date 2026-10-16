'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { dataStore } from '@/lib/data-store';
import { toBanglaNumber, formatDate } from '@/lib/bangla-utils';
import { generateVerificationPdf } from '@/lib/pdf-generator';
import RiskBadge from '@/components/RiskBadge';
import {
  LayoutDashboard,
  Search,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Upload,
  ArrowRight,
  Download,
  AlertOctagon,
  CheckCircle2,
  Clock,
  User,
  Lock,
} from 'lucide-react';

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [downloadingDocId, setDownloadingDocId] = React.useState<string | null>(null);

  const handleDownloadDocument = async (docId: string, fileName: string) => {
    if (user?.role !== 'officer') {
      alert('Forbidden: Document downloads are restricted to Land Officers.');
      return;
    }

    setDownloadingDocId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/download`, {
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert('401 Unauthorized: Please sign in as a Land Officer to download.');
        } else if (res.status === 403) {
          alert('403 Forbidden: Document downloads are restricted to Land Officers.');
        } else {
          alert(`Download failed with status ${res.status}`);
        }
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Download error: ${err.message}`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const verifications = dataStore.getVerifications();
  const documents = dataStore.getDocuments();
  const totalRecords = dataStore.getRecords().length;

  const highRisksCount = verifications.filter((v) => v.overallLevel === 'high').length;
  const cleanCount = verifications.filter((v) => v.overallLevel === 'low').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-700">
              {language === 'bn' ? 'স্বাগতম' : 'Welcome'}, {user?.fullName || 'Citizen Buyer'}
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full capitalize">
              {user?.role || 'Citizen'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.dashTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">{t.dashSubtitle}</p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t.btnSearch}</span>
          </Link>
          <Link
            href="/upload"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.btnUploadDoc}</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.dashTotalSearches}
            </span>
            <Search className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {language === 'bn' ? toBanglaNumber(totalRecords * 3 + 4) : totalRecords * 3 + 4}
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'bn' ? 'নমুনা ডেটাবেজে অনুসন্ধান' : 'Simulated query count'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.dashVerificationsDone}
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800">
            {language === 'bn' ? toBanglaNumber(verifications.length) : verifications.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            {language === 'bn'
              ? `${toBanglaNumber(cleanCount)}টি সন্তোষজনক`
              : `${cleanCount} with low concern`}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.dashDiscrepanciesFound}
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {language === 'bn' ? toBanglaNumber(highRisksCount) : highRisksCount}
          </div>
          <div className="text-[11px] text-rose-500 font-medium">
            {language === 'bn' ? 'জরুরি আইনি সতর্কতা' : 'Urgent legal alerts'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {language === 'bn' ? 'নথি প্রক্রিয়াকরণ' : 'Processed Documents'}
            </span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {language === 'bn'
              ? toBanglaNumber(documents.length > 0 ? documents.length : 2)
              : documents.length > 0
              ? documents.length
              : 2}
          </div>
          <div className="text-[11px] text-slate-400">
            {language === 'bn' ? 'ওসিআর বিশ্লেষিত' : 'OCR scans logged'}
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Screenings & Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Verifications */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{t.dashRecentVerifications}</span>
            </h3>
            <Link
              href="/verify"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>{language === 'bn' ? 'সবগুলো দেখুন' : 'View All'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {verifications.slice(0, 5).map((v) => {
              const rec = v.landRecord;
              return (
                <div
                  key={v.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {rec?.mouza || 'Simulated Plot'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (Dag #{rec?.dagNo || 'N/A'})
                      </span>
                      <RiskBadge severity={v.overallLevel} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500">
                      Code: <span className="font-mono">{v.verificationCode}</span> •{' '}
                      {formatDate(v.createdAt, language)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/records/${v.landRecordId}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      {t.btnViewDetails}
                    </Link>
                    {/* Document Download Option: Visible strictly for authenticated Land Officers */}
                    {user?.role === 'officer' && (
                      <button
                        onClick={() => generateVerificationPdf(v, language)}
                        className="p-1.5 text-xs rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
                        title="Download PDF Dossier"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Awareness */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {t.dashQuickActions}
            </h3>
            <div className="space-y-2 text-xs font-semibold">
              <Link
                href="/search"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/60 transition-colors"
              >
                <span>{language === 'bn' ? 'নতুন খতিয়ান অনুসন্ধান' : 'Search Land Records'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/upload"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/60 transition-colors"
              >
                <span>{language === 'bn' ? 'দলিল ওসিআর রূপান্তর' : 'Upload & OCR Deed'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/verify"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/60 transition-colors"
              >
                <span>{language === 'bn' ? 'ঝুঁকি স্ক্রিনিং ড্যাশবোর্ড' : 'Run Risk Screener'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="bg-emerald-900 rounded-3xl p-6 text-white space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'bn' ? 'নাগরিক টিপস' : 'Buyer Tip'}</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {language === 'bn'
                ? 'অনলাইনে যাচাই করার পর রেজিস্ট্রি করার আগে অবশ্যই স্থানীয় ইউনিয়ন ভূমি সহকারী কর্মকর্তার নিকট থেকে সর্বশেষ খাজনা রসিদের রেকর্ড নিশ্চিত করুন।'
                : 'Always cross-check physical possession and boundary maps with a certified Amin before paying your contract deposit.'}
            </p>
          </div>
        </div>
      </div>

      {/* Land Documents & Deeds Archive (Role-Restricted: Active Download for Land Officers) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'সংরক্ষিত ভূমি দলিল ও খতিয়ান নথি' : 'Protected Land Documents & Deeds Archive'}</span>
              </h3>
              {user?.role === 'officer' ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  {language === 'bn' ? 'ডাউনলোড সক্রিয় (ভূমি কর্মকর্তা)' : 'Downloads Active (Land Officer)'}
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">
                  {language === 'bn' ? 'ভূমি কর্মকর্তাদের জন্য সংরক্ষিত' : 'Restricted to Land Officers'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {language === 'bn'
                ? 'অনুমোদিত দলিলের স্ক্যান ও ডিজিটাল নামজারি রেকর্ড। ডাউনলোড সুবিধা নীতিমালার অধীনে সংরক্ষিত।'
                : 'Certified sub-registry deed scans and AC Land mutation records. Document download permissions are strictly role-enforced.'}
            </p>
          </div>

          {user?.role === 'officer' && (
            <Link
              href="/officer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0"
            >
              <span>{language === 'bn' ? 'ভূমি কর্মকর্তা শাখা পোর্টাল' : 'Open Land Officer Section'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* List of Documents */}
        <div className="divide-y divide-slate-100">
          {documents.map((doc) => {
            const isDownloading = downloadingDocId === doc.id;
            return (
              <div
                key={doc.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{doc.fileName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase font-semibold">
                      {doc.documentType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {doc.extractedFields.mouza || 'Dhaka'} • Dag #{doc.extractedFields.dagNo || 'N/A'} • {Math.round(doc.fileSize / 1024)} KB
                  </div>
                </div>

                {/* Role-Enforced Download Option: ONLY visible & active for Land Officers */}
                {user?.role === 'officer' ? (
                  <button
                    onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                    disabled={isDownloading}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors self-end sm:self-auto cursor-pointer disabled:opacity-50"
                    title="Download Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloading ? (language === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...') : (language === 'bn' ? 'ডাউনলোড' : 'Download Document')}</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 italic self-end sm:self-auto flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>{language === 'bn' ? 'ডাউনলোড শুধুমাত্র ভূমি কর্মকর্তাদের জন্য' : 'Download restricted to Land Officers'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
