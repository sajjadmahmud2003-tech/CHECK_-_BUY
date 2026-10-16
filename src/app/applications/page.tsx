'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LandApplication, ApplicationStatus } from '@/types';
import { formatDate } from '@/lib/bangla-utils';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  ArrowRight,
  Filter,
  Search,
  Plus,
  Building2,
  ShieldAlert,
  Loader2,
  FileCheck2,
} from 'lucide-react';

export default function MyApplicationsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [applications, setApplications] = useState<LandApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplications() {
      try {
        const res = await fetch('/api/applications');
        const data = await res.json();
        if (data.success && data.applications) {
          setApplications(data.applications);
        }
      } catch (err) {
        console.error('Failed to load applications', err);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  const handleDownloadPdf = async (appId: string, appNumber: string) => {
    setDownloadingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/download`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to download certified document.');
        setDownloadingId(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certified_Document_${appNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Network error downloading document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{language === 'bn' ? 'অপেক্ষমান (Pending)' : 'Pending Review'}</span>
          </span>
        );
      case 'Under_Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200">
            <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
            <span>{language === 'bn' ? 'যাচাই চলছে (Under Review)' : 'Under Review'}</span>
          </span>
        );
      case 'Correction_Required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>{language === 'bn' ? 'সংশোধন প্রয়োজন' : 'Correction Required'}</span>
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            <span>{language === 'bn' ? 'অনুমোদিত (Approved)' : 'Approved'}</span>
          </span>
        );
      case 'Document_Available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 shadow-2xs">
            <FileCheck2 className="w-3 h-3 text-emerald-600" />
            <span>{language === 'bn' ? 'দলিল প্রস্তুত (Ready)' : 'Document Ready'}</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-300">
            <XCircle className="w-3 h-3 text-slate-500" />
            <span>{language === 'bn' ? 'বাতিলকৃত (Rejected)' : 'Rejected'}</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const filtered = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.applicationNumber.toLowerCase().includes(q) ||
        app.mouza.toLowerCase().includes(q) ||
        app.upazila.toLowerCase().includes(q) ||
        app.dagNo.includes(q) ||
        app.khatianNo.includes(q)
      );
    }
    return true;
  });

  const countPending = applications.filter((a) => a.status === 'Pending').length;
  const countUnderReview = applications.filter((a) => a.status === 'Under_Review').length;
  const countReady = applications.filter((a) => a.status === 'Document_Available' || a.status === 'Approved').length;
  const countCorrection = applications.filter((a) => a.status === 'Correction_Required').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Citizen Land Services Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'আমার দলিলের আবেদনসমূহ' : 'My Land Document Applications'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'bn'
              ? 'আপনার দাখিলকৃত সকল খতিয়ান, পর্চা ও দলিলের সার্টিফাইড অনুলিপি আবেদনের বর্তমান অবস্থা ও ডাউনলোড'
              : 'Track status, officer communications, corrections, and download certified copies of your applications.'}
          </p>
        </div>

        <Link
          href="/apply"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন দলিলের আবেদন করুন' : 'Apply for New Document'}</span>
        </Link>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {language === 'bn' ? 'মোট আবেদন' : 'Total Applications'}
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{applications.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-800 block">
            {language === 'bn' ? 'যাচাই অপেক্ষমান' : 'Pending / In Review'}
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">{countPending + countUnderReview}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-800 block">
            {language === 'bn' ? 'ডাউনলোড প্রস্তুত' : 'Ready for Download'}
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">{countReady}</span>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-800 block">
            {language === 'bn' ? 'সংশোধন প্রয়োজন' : 'Action Required'}
          </span>
          <span className="text-2xl font-black text-rose-900 mt-1 block">{countCorrection}</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-1.5">
          {[
            { id: 'all', label: language === 'bn' ? 'সকল' : 'All' },
            { id: 'Pending', label: language === 'bn' ? 'অপেক্ষমান' : 'Pending' },
            { id: 'Under_Review', label: language === 'bn' ? 'যাচাই চলছে' : 'Under Review' },
            { id: 'Correction_Required', label: language === 'bn' ? 'সংশোধন' : 'Correction' },
            { id: 'Document_Available', label: language === 'bn' ? 'প্রস্তুত' : 'Document Ready' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'দাগ, খতিয়ান বা আইডি খুঁজুন...' : 'Search Dag, Khatian or ID...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">{language === 'bn' ? 'আবেদনসমূহ লোড হচ্ছে...' : 'Loading your applications...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {language === 'bn' ? 'কোনো আবেদন পাওয়া যায়নি' : 'No applications found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? (language === 'bn' ? 'এই ফিল্টারে কোনো আবেদন নেই।' : 'No records match the selected status filter.')
              : (language === 'bn' ? 'আপনি এখনো কোনো খতিয়ান বা দলিলের সার্টিফাইড অনুলিপির আবেদন করেননি।' : 'You have not submitted any land document applications yet.')}
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'প্রথম আবেদন শুরু করুন' : 'Submit an Application'}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isReady = app.status === 'Document_Available' || app.status === 'Approved';
            const isCorrection = app.status === 'Correction_Required';

            return (
              <div
                key={app.id}
                className={`bg-white rounded-3xl p-6 border transition-all space-y-4 ${
                  isCorrection
                    ? 'border-rose-300 shadow-sm'
                    : isReady
                    ? 'border-emerald-200 hover:border-emerald-300 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {app.applicationNumber}
                        </span>
                        {getStatusBadge(app.status)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {language === 'bn' ? 'দাখিলের তারিখ: ' : 'Submitted: '}
                        {formatDate(app.submittedAt, language)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isReady && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(app.id, app.applicationNumber)}
                        disabled={downloadingId === app.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {downloadingId === app.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{language === 'bn' ? 'দলিল ডাউনলোড' : 'Download PDF'}</span>
                      </button>
                    )}

                    <Link
                      href={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <span>{language === 'bn' ? 'বিস্তারিত' : 'Details'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">{language === 'bn' ? 'সেবার ধরন' : 'Document Type'}</span>
                    <span className="font-bold text-slate-800 capitalize mt-0.5 block truncate">
                      {app.documentType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">{language === 'bn' ? 'মৌজা ও উপজেলা' : 'Mouza / Upazila'}</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">
                      {app.mouza}, {app.upazila}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">{language === 'bn' ? 'দাগ ও খতিয়ান' : 'Plot / Khatian'}</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      Dag #{app.dagNo}, Khat #{app.khatianNo}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">{language === 'bn' ? 'সংশ্লিষ্ট দপ্তর' : 'Assigned Office'}</span>
                    <span className="font-bold text-slate-800 mt-0.5 block truncate">
                      {app.assignedOffice}
                    </span>
                  </div>
                </div>

                {/* Officer Message Banner if available */}
                {app.officerMessage && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{language === 'bn' ? 'ভূমি কর্মকর্তার বার্তা:' : 'Officer Remarks:'}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{app.officerMessage}</p>
                  </div>
                )}

                {/* Correction Instructions Alert */}
                {isCorrection && app.correctionInstructions && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{language === 'bn' ? 'জরুরি সংশোধনী নির্দেশিকা:' : 'Required Action / Correction:'}</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">{app.correctionInstructions}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
