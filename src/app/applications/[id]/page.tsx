'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ArrowLeft,
  Building2,
  User,
  ShieldCheck,
  FileCheck2,
  Paperclip,
  Loader2,
  Calendar,
  Lock,
  History,
} from 'lucide-react';

export default function ApplicationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [application, setApplication] = useState<LandApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      try {
        const res = await fetch(`/api/applications/${id}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Failed to load application details.');
          setLoading(false);
          return;
        }
        setApplication(data.application);
      } catch (err: any) {
        setErrorMsg(err.message || 'Network error fetching application.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!application) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/applications/${application.id}/download`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Download failed: Document is not available or unauthorized.');
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certified_Document_${application.applicationNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Network error downloading document.');
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Review (অপেক্ষমান)</span>
          </span>
        );
      case 'Under_Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Under Review (যাচাই চলছে)</span>
          </span>
        );
      case 'Correction_Required':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Correction Required (সংশোধন প্রয়োজন)</span>
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-900 text-xs font-bold border border-teal-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Approved (অনুমোদিত)</span>
          </span>
        );
      case 'Document_Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-300 shadow-2xs">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Document Ready for Download (দলিল প্রস্তুত)</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Rejected (বাতিলকৃত)</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500">{language === 'bn' ? 'আবেদনের বিবরণ লোড হচ্ছে...' : 'Loading application tracking record...'}</p>
      </div>
    );
  }

  if (errorMsg || !application) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {language === 'bn' ? 'আবেদন দেখতে সমস্যা হয়েছে' : 'Application Not Accessible'}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'bn' ? 'আমার আবেদন তালিকায় ফিরুন' : 'Back to My Applications'}</span>
        </Link>
      </div>
    );
  }

  const isDocumentReady = application.status === 'Document_Available' || application.status === 'Approved';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'আমার আবেদনসমূহে ফিরুন' : 'Back to My Applications'}</span>
        </Link>

        <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
          ID: {application.applicationNumber}
        </span>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight capitalize">
              {application.documentType.replace(/_/g, ' ')}
            </h1>
            {getStatusBadge(application.status)}
          </div>
          <p className="text-xs text-slate-500">
            {language === 'bn' ? 'জমির অবস্থান: ' : 'Plot Location: '}
            <span className="font-semibold text-slate-700">
              {application.mouza}, {application.upazila}, {application.district} (Dag #{application.dagNo}, Khatian #{application.khatianNo})
            </span>
          </p>
          <p className="text-[11px] text-slate-400">
            {language === 'bn' ? 'দাখিলের তারিখ: ' : 'Submitted: '}
            {formatDate(application.submittedAt, language)}
          </p>
        </div>

        {/* Action Button: Download if ready */}
        {isDocumentReady && (
          <div className="shrink-0">
            <button
              type="button"
              id="download-certified-doc-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{language === 'bn' ? 'সার্টিফাইড দলিল ডাউনলোড করুন (PDF)' : 'Download Certified PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Officer Remarks / Correction Card */}
      {application.officerMessage && (
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>{language === 'bn' ? 'সহকারী কমিশনার (ভূমি) এর মন্তব্য ও অগ্রগতি' : 'AC Land Office Remarks & Review Status'}</span>
          </div>
          <p className="text-slate-600 leading-relaxed pl-6">{application.officerMessage}</p>
        </div>
      )}

      {application.status === 'Correction_Required' && application.correctionInstructions && (
        <div className="p-5 rounded-3xl bg-rose-50 border border-rose-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{language === 'bn' ? 'জরুরি সংশোধনী নির্দেশনা' : 'Required Correction Instructions'}</span>
          </div>
          <p className="text-rose-800 leading-relaxed pl-6">{application.correctionInstructions}</p>
        </div>
      )}

      {/* Grid: 1. Applicant & Land Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Applicant Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'আবেদনকারী তথ্য' : 'Applicant Information'}</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'পুরো নাম:' : 'Full Name:'}</span>
              <span className="font-bold text-slate-900">{application.citizenName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
              <span className="font-bold text-slate-900">{application.citizenPhone}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'ইমেইল:' : 'Email:'}</span>
              <span className="font-bold text-slate-900">{application.citizenEmail || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'এনআইডি (NID):' : 'National ID:'}</span>
              <span className="font-bold text-slate-900">
                {application.citizenNid ? `•••• •••• ${application.citizenNid.slice(-4)}` : 'On Record'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{language === 'bn' ? 'সম্পর্ক:' : 'Ownership Relation:'}</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                {application.ownershipRelation}
              </span>
            </div>
          </div>
        </div>

        {/* Land Schedule Details */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'জমির তফসিল ও সনাক্তকরণ' : 'Land Schedule & Location'}</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'জেলা ও উপজেলা:' : 'District & Upazila:'}</span>
              <span className="font-bold text-slate-900">{application.district}, {application.upazila}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'মৌজা ও জেএল:' : 'Mouza & JL No:'}</span>
              <span className="font-bold text-slate-900">{application.mouza} {application.jlNumber ? `(JL #${application.jlNumber})` : ''}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'খতিয়ান নম্বর:' : 'Khatian No:'}</span>
              <span className="font-bold text-slate-900">#{application.khatianNo}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">{language === 'bn' ? 'দাগ নম্বর:' : 'Plot / Dag No:'}</span>
              <span className="font-bold text-slate-900">#{application.dagNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{language === 'bn' ? 'সংশ্লিষ্ট কার্যালয়:' : 'Assigned Archive:'}</span>
              <span className="font-bold text-slate-700 truncate max-w-[200px]">{application.assignedOffice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stated Purpose & Supporting Attachments */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
          <Paperclip className="w-4 h-4 text-emerald-600" />
          <span>{language === 'bn' ? 'আবেদনের উদ্দেশ্য ও সংযুক্ত প্রমাণক' : 'Application Purpose & Supporting Files'}</span>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-slate-400 block font-medium mb-1">{language === 'bn' ? 'আবেদনের উদ্দেশ্য:' : 'Stated Purpose:'}</span>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-2xl border border-slate-200 leading-relaxed">
              {application.purpose}
            </p>
          </div>

          {application.additionalInfo && (
            <div>
              <span className="text-slate-400 block font-medium mb-1">{language === 'bn' ? 'বিশেষ বিবরণ:' : 'Additional Notes:'}</span>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200 leading-relaxed">
                {application.additionalInfo}
              </p>
            </div>
          )}

          {application.attachments && application.attachments.length > 0 && (
            <div>
              <span className="text-slate-400 block font-medium mb-2">{language === 'bn' ? 'সংযুক্ত ফাইলসমূহ:' : 'Attached Files:'}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {application.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{att.fileName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {(att.fileSize / 1024).toFixed(0)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Certified Document Card (If Available) */}
      {application.officialDocument && (
        <div className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-300 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{language === 'bn' ? 'অফিসিয়াল সত্যায়িত ডিজিটাল কপি' : 'Official Certified Digital Copy'}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
              Verified v{application.officialDocument.documentVersion}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-emerald-700 block text-[11px] font-medium">{language === 'bn' ? 'ফাইল নাম' : 'File Name'}</span>
              <span className="font-bold text-slate-900 block truncate mt-0.5">{application.officialDocument.fileName}</span>
            </div>
            <div>
              <span className="text-emerald-700 block text-[11px] font-medium">{language === 'bn' ? 'অনুমোদনকারী কর্মকর্তা' : 'Attesting Land Officer'}</span>
              <span className="font-bold text-slate-900 block truncate mt-0.5">{application.officialDocument.uploaderName || 'Land Officer'}</span>
            </div>
            <div>
              <span className="text-emerald-700 block text-[11px] font-medium">{language === 'bn' ? 'ভেরিফিকেশন সিকিউরিটি কোড' : 'Verification Security Hash'}</span>
              <span className="font-mono text-[10px] text-slate-800 block truncate mt-0.5 font-bold">
                {application.officialDocument.verificationHash}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'bn' ? 'ডিজিটাল সত্যায়িত কপি ডাউনলোড করুন' : 'Download Certified Digital Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Status History Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
          <History className="w-4 h-4 text-emerald-600" />
          <span>{language === 'bn' ? 'আবেদনের অগ্রগতির ইতিহাস (Audit Timeline)' : 'Application Status Audit Timeline'}</span>
        </div>

        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {application.statusHistory.map((step, idx) => (
            <div key={step.id || idx} className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-2xs" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs">
                    {step.oldStatus} ➔ {step.newStatus}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(step.createdAt, language)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  <span className="font-medium text-slate-700">{step.changedByName}:</span> {step.reason || 'Status update logged'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
