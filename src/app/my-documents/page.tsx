'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LandApplication } from '@/types';
import { formatDate } from '@/lib/bangla-utils';
import {
  FileText,
  Download,
  Building2,
  FileCheck2,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Loader2,
  ArrowRight,
  Search,
} from 'lucide-react';

export default function MyDocumentsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [applications, setApplications] = useState<LandApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const res = await fetch('/api/applications');
        const data = await res.json();
        if (data.success && data.applications) {
          // Filter to only those with document ready or approved
          const docs = data.applications.filter(
            (a: LandApplication) => a.status === 'Document_Available' || a.status === 'Approved'
          );
          setApplications(docs);
        }
      } catch (err) {
        console.error('Failed to load documents', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  const handleDownloadPdf = async (appId: string, appNumber: string) => {
    setDownloadingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/download`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to download document.');
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
    } catch {
      alert('Network error downloading document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.applicationNumber.toLowerCase().includes(q) ||
      app.mouza.toLowerCase().includes(q) ||
      app.upazila.toLowerCase().includes(q) ||
      app.dagNo.includes(q) ||
      app.khatianNo.includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Digital Land Registry Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'আমার অনুমোদিত দলিল ও খতিয়ান' : 'My Approved Land Documents'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'bn'
              ? 'ভূমি কর্মকর্তা কর্তৃক অনুমোদিত এবং ডিজিটাল সত্যায়িত আপনার যাবতীয় দলিলের নিরাপদ ভল্ট।'
              : 'Secure repository of official, certified digital land documents verified by AC Land Officers.'}
          </p>
        </div>

        <Link
          href="/apply"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন দলিলের আবেদন' : 'Apply for Document'}</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'bn' ? 'মৌজা, দাগ, খতিয়ান বা আইডি খুঁজুন...' : 'Search Mouza, Dag, Khatian or ID...'}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 hidden sm:block">
          {language === 'bn' ? `মোট প্রস্তুত দলিল: ${applications.length}` : `Ready Documents: ${applications.length}`}
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">{language === 'bn' ? 'দলিল ভল্ট লোড হচ্ছে...' : 'Accessing secure document vault...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {language === 'bn' ? 'কোনো প্রস্তুত দলিল পাওয়া যায়নি' : 'No approved documents ready yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'bn'
              ? 'সহকারী কমিশনার (ভূমি) আপনার কোনো আবেদন অনুমোদন ও ডিজিটাল ফাইল রিলিজ করলে এখানে সরাসরি ডাউনলোডের জন্য প্রদর্শিত হবে।'
              : 'Once an AC Land Officer approves your document request and uploads the certified PDF, it will appear here for download.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/applications"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
            >
              {language === 'bn' ? 'আবেদনের স্ট্যাটাস দেখুন' : 'Check Application Status'}
            </Link>
            <Link
              href="/apply"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              {language === 'bn' ? 'নতুন আবেদন করুন' : 'Apply for Document'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm capitalize">
                      {app.documentType.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ID: <span className="font-mono font-bold text-slate-600">{app.applicationNumber}</span>
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Certified</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'bn' ? 'অবস্থান:' : 'Location:'}</span>
                  <span className="font-bold text-slate-800">{app.mouza}, {app.upazila}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{language === 'bn' ? 'দাগ ও খতিয়ান:' : 'Plot / Khatian:'}</span>
                  <span className="font-bold text-slate-800">Dag #{app.dagNo}, Khat #{app.khatianNo}</span>
                </div>
                {app.officialDocument && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'bn' ? 'নিরাপত্তা কোড:' : 'Security Hash:'}</span>
                    <span className="font-mono text-[10px] text-slate-600 font-bold truncate max-w-[160px]">
                      {app.officialDocument.verificationHash}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href={`/applications/${app.id}`}
                  className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>{language === 'bn' ? 'ট্র্যাকিং দেখুন' : 'View Tracking'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(app.id, app.applicationNumber)}
                  disabled={downloadingId === app.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {downloadingId === app.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'bn' ? 'PDF ডাউনলোড' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
