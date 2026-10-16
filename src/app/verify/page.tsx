'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { dataStore } from '@/lib/data-store';
import { analyzeLandRecordRisks } from '@/lib/risk-engine';
import { generateAIExplanation, AIExplanationResult } from '@/lib/ai-assistant';
import { generateVerificationPdf } from '@/lib/pdf-generator';
import { LandRecord, VerificationResult, RiskSeverity, LandApplication } from '@/types';
import RiskBadge from '@/components/RiskBadge';
import { toBanglaNumber, formatArea } from '@/lib/bangla-utils';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Info,
  Scale,
  RotateCcw,
  Lock,
  FileCheck2,
  Clock,
  ExternalLink,
} from 'lucide-react';

function VerifyContent() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('recordId') || 'rec-dhanmondi-101';

  const [selectedRecordId, setSelectedRecordId] = useState<string>(preselectedId);
  const [currentRecord, setCurrentRecord] = useState<LandRecord | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Official Application Tracking on this specific Plot
  const [plotApplication, setPlotApplication] = useState<LandApplication | null>(null);
  const [checkingApp, setCheckingApp] = useState(false);
  const [downloadingOfficialDoc, setDownloadingOfficialDoc] = useState(false);
  const [officialDocDownloadError, setOfficialDocDownloadError] = useState<string | null>(null);

  const allRecords = dataStore.getRecords();

  const runVerification = async (recordId: string) => {
    const record = dataStore.getRecordById(recordId);
    if (!record) return;

    setLoading(true);
    setCurrentRecord(record);

    // 1. Run deterministic rule-based screening engine
    const result = dataStore.createVerification(record, user?.id);
    setVerification(result);

    // 2. Generate grounded AI explanation & citizen reasoning
    try {
      const aiResult = await generateAIExplanation(record, result);
      setAiExplanation(aiResult);
    } catch {
      // Handled internally in ai-assistant
    }

    setLoading(false);
  };

  useEffect(() => {
    if (selectedRecordId) {
      runVerification(selectedRecordId);
    }
  }, [selectedRecordId]);

  // Check if citizen has submitted an official land document application for this plot
  useEffect(() => {
    if (!currentRecord || !user) {
      setPlotApplication(null);
      return;
    }

    const checkPlotApplication = async () => {
      setCheckingApp(true);
      try {
        const res = await fetch('/api/applications');
        const data = await res.json();
        if (data.success && Array.isArray(data.applications)) {
          const matched = data.applications.find(
            (a: LandApplication) =>
              (a.dagNo === currentRecord.dagNo || a.khatianNo === currentRecord.khatianNo) &&
              a.citizenId === user.id
          );
          setPlotApplication(matched || null);
        }
      } catch {
        // Silently handled
      } finally {
        setCheckingApp(false);
      }
    };

    checkPlotApplication();
  }, [currentRecord, user]);

  const handleDownloadPdf = () => {
    if (!verification) return;
    generateVerificationPdf(verification, language);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadOfficialDocument = async (appId: string) => {
    setDownloadingOfficialDoc(true);
    setOfficialDocDownloadError(null);

    try {
      const res = await fetch(`/api/applications/${appId}/download`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Download failed with status ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certified_Document_${plotApplication?.applicationNumber || 'OFFICIAL'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setOfficialDocDownloadError(err.message || 'Error downloading official certified document.');
    } finally {
      setDownloadingOfficialDoc(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.riskTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'bn'
              ? 'ঐতিহাসিক জরিপ খতিয়ান, নামজারি ও মালিকানা বিশ্লেষণ করে স্বয়ংক্রিয় স্ক্রিনিং'
              : 'Deterministic screening of ownership continuity, area variances, and mutation status'}
          </p>
        </div>

        {/* Action Buttons */}
        {verification && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Apply for Official Land Document CTA Button */}
            {currentRecord && (
              <Link
                href={`/apply?district=${encodeURIComponent(currentRecord.district)}&upazila=${encodeURIComponent(currentRecord.upazila)}&mouza=${encodeURIComponent(currentRecord.mouza)}&khatianNo=${encodeURIComponent(currentRecord.khatianNo)}&dagNo=${encodeURIComponent(currentRecord.dagNo)}&jlNumber=${encodeURIComponent(currentRecord.jlNumber)}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                id="verify-apply-official-doc-btn"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'bn' ? 'অফিসিয়াল দলিলের আবেদন' : 'Apply for Official Document'}</span>
              </Link>
            )}

            {/* Clearly Labeled Unofficial Demo Risk Report Download Button */}
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              title={language === 'bn' ? 'অনানুষ্ঠানিক ডেমো ঝুঁকি মূল্যায়ন রিপোর্ট ডাউনলোড করুন' : 'Download Unofficial Demo Risk Report'}
              id="verify-download-risk-report-btn"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{language === 'bn' ? 'ডেমো ঝুঁকি রিপোর্ট (অনানুষ্ঠানিক)' : 'Demo Risk Report (Unofficial)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.btnPrintReport}</span>
            </button>
          </div>
        )}
      </div>

      {/* Select Property to Screen */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {language === 'bn' ? 'যাচাই করার জন্য জমি নির্বাচন করুন:' : 'Select Property to Screen:'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {allRecords.map((r) => {
            const isSelected = r.id === selectedRecordId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRecordId(r.id)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>{language === 'bn' ? r.mouzaBn : r.mouza}</span>
                  <span className="text-[10px] text-slate-500">
                    Dag #{language === 'bn' ? toBanglaNumber(r.dagNo) : r.dagNo}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {r.upazila}, {r.district} • {formatArea(r.areaDecimals, language)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Results Container */}
      {verification && currentRecord && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'bn' ? 'যাচাইকরণ কোড:' : 'Verification ID:'}
                  </span>
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {verification.verificationCode}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentRecord.mouza} (Dag #{currentRecord.dagNo}, Khatian #{currentRecord.khatianNo})
                </h2>
                <p className="text-xs text-slate-500">
                  {currentRecord.upazila}, {currentRecord.district} •{' '}
                  {formatArea(currentRecord.areaDecimals, language)}
                </p>
              </div>

              {/* Score Indicator */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {t.riskScoreLabel}
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {language === 'bn'
                      ? toBanglaNumber(verification.overallScore)
                      : verification.overallScore}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <RiskBadge severity={verification.overallLevel} size="lg" />
              </div>
            </div>

            {/* Plain Summary Statement */}
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed border ${
                verification.overallLevel === 'high'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : verification.overallLevel === 'medium'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
            >
              {language === 'bn' ? verification.summaryBn : verification.summaryEn}
            </div>

            {/* AI Explanation Card */}
            {aiExplanation && (
              <div className="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-2xl p-6 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{t.riskExplanationTitle}</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {aiExplanation.engineUsed === 'gemini-model'
                      ? 'Gemini LLM Active'
                      : 'Deterministic Reasoner'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {language === 'bn' ? aiExplanation.explanationBn : aiExplanation.explanationEn}
                </p>
              </div>
            )}
          </div>

          {/* Official Land Document & Officer Approval Workflow Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    {language === 'bn' ? 'অফিসিয়াল খতিয়ান ও দলিল অনুমোদন ব্যবস্থা' : 'Official Land Document & Officer Approval System'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {language === 'bn'
                    ? 'ঝুঁকি স্ক্রিনার স্বয়ংক্রিয় অনুসন্ধান প্রদান করে। সরকারি সত্যায়িত অনুলিপি পেতে পৃথক আবেদন ও সহকারী কমিশনার (ভূমি) এর অনুমোদন আবশ্যক।'
                    : 'Risk Scanner provides automated screening. To obtain certified government-issued land records, submit a formal application for Land Officer verification.'}
                </p>
              </div>

              {currentRecord && (
                <Link
                  href={`/apply?district=${encodeURIComponent(currentRecord.district)}&upazila=${encodeURIComponent(currentRecord.upazila)}&mouza=${encodeURIComponent(currentRecord.mouza)}&khatianNo=${encodeURIComponent(currentRecord.khatianNo)}&dagNo=${encodeURIComponent(currentRecord.dagNo)}&jlNumber=${encodeURIComponent(currentRecord.jlNumber)}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{language === 'bn' ? 'নতুন দলিলের আবেদন' : 'Apply for Official Document'}</span>
                </Link>
              )}
            </div>

            {/* Application Status State on this specific Plot */}
            {checkingApp ? (
              <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 animate-pulse">
                {language === 'bn' ? 'আবেদনের অবস্থা যাচাই করা হচ্ছে...' : 'Checking application status with Land Office...'}
              </div>
            ) : plotApplication ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {language === 'bn' ? 'আবেদন নম্বর:' : 'Application ID:'}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {plotApplication.applicationNumber}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">
                      {plotApplication.documentType.replace(/_/g, ' ').toUpperCase()} • {plotApplication.mouza} (Dag #{plotApplication.dagNo})
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div>
                    {plotApplication.status === 'Document_Available' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'দলিল ডাউনলোডের জন্য প্রস্তুত' : 'Document Ready'}
                      </span>
                    )}
                    {plotApplication.status === 'Approved' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'অনুমোদিত (পিডিএফ আপলোড বাকি)' : 'Approved (Awaiting PDF)'}
                      </span>
                    )}
                    {plotApplication.status === 'Under_Review' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'ভূমি কর্মকর্তা পর্যালোচনা করছেন' : 'Under Officer Review'}
                      </span>
                    )}
                    {plotApplication.status === 'Pending' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'অনুমোদনের অপেক্ষায় (Pending)' : 'Pending Approval'}
                      </span>
                    )}
                    {plotApplication.status === 'Correction_Required' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'সংশোধন প্রয়োজন' : 'Correction Required'}
                      </span>
                    )}
                    {plotApplication.status === 'Rejected' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'আবেদন বাতিল' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </div>

                {/* State Explanations & Action Lock */}
                <div className="text-xs text-slate-600 leading-relaxed">
                  {plotApplication.status === 'Document_Available' && (
                    <div className="text-emerald-800 font-medium">
                      ✓ {language === 'bn'
                        ? 'ভূমি কর্মকর্তা আপনার আবেদন পর্যালোচনা করে অনুমোদিত সার্টিফাইড পিডিএফ আপলোড করেছেন। আপনি সরাসরি এটি ডাউনলোড করতে পারেন।'
                        : 'The Land Officer has approved your application and uploaded the official certified PDF with cryptographic verification seal.'}
                    </div>
                  )}

                  {plotApplication.status === 'Approved' && (
                    <div className="text-teal-800 font-medium">
                      ℹ️ {language === 'bn'
                        ? 'আবেদনটি অনুমোদিত হয়েছে। কর্মকর্তা কর্তৃক চূড়ান্ত অফিসিয়াল পিডিএফ আপলোড সম্পন্ন হলে ডাউনলোড লিংক সক্রিয় হবে।'
                        : 'Application approved! The Land Officer is preparing and attaching the final certified PDF. The download button will unlock automatically once uploaded.'}
                    </div>
                  )}

                  {(plotApplication.status === 'Pending' || plotApplication.status === 'Under_Review') && (
                    <div className="text-amber-800 font-medium">
                      🔒 {language === 'bn'
                        ? 'আবেদনটি বর্তমানে সহকারী কমিশনার (ভূমি) এর টেবিলে যাচাইাধীন। অনুমোদন ব্যতীত অফিসিয়াল দলিল ডাউনলোড সম্পূর্ণ সুরক্ষিত ও নিষিদ্ধ।'
                        : 'Official document download remains strictly locked until an authorized Land Officer reviews and approves your submission.'}
                    </div>
                  )}

                  {plotApplication.status === 'Correction_Required' && (
                    <div className="text-orange-900 font-medium bg-orange-50 p-3 rounded-xl border border-orange-200">
                      ⚠️ {language === 'bn' ? 'সংশোধনের নির্দেশ:' : 'Officer Correction Note:'}{' '}
                      {plotApplication.officerMessage || 'Please review correction instructions in My Applications.'}
                    </div>
                  )}

                  {plotApplication.status === 'Rejected' && (
                    <div className="text-rose-900 font-medium bg-rose-50 p-3 rounded-xl border border-rose-200">
                      ✕ {language === 'bn' ? 'বাতিলের কারণ:' : 'Rejection Reason:'}{' '}
                      {plotApplication.rejectionReason || 'Does not meet documentary requirements.'}
                    </div>
                  )}
                </div>

                {officialDocDownloadError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    {officialDocDownloadError}
                  </div>
                )}

                {/* Action Bar for Existing Application */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <Link
                    href={`/applications/${plotApplication.id}`}
                    className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{language === 'bn' ? 'আবেদনের বিস্তারিত ও স্ট্যাটাস টাইমলাইন দেখুন' : 'View Application Details & Audit Timeline'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {/* Official Download Button: Strictly enabled ONLY when Document_Available */}
                  {plotApplication.status === 'Document_Available' ? (
                    <button
                      onClick={() => handleDownloadOfficialDocument(plotApplication.id)}
                      disabled={downloadingOfficialDoc}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      id="verify-download-approved-pdf-btn"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {downloadingOfficialDoc
                          ? (language === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading...')
                          : (language === 'bn' ? 'অনুমোদিত সার্টিফাইড দলিল ডাউনলোড' : 'Download Authorized Official PDF')}
                      </span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center gap-2 cursor-not-allowed"
                      title="Download locked until officer approval and document release"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {plotApplication.status === 'Approved'
                          ? (language === 'bn' ? 'পিডিএফ আপলোডের অপেক্ষায় • লকড' : 'PDF Upload Pending • Locked')
                          : (language === 'bn' ? 'অনুমোদনের অপেক্ষায় • ডাউনলোড লকড' : 'Download Locked (Pending Approval)')}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">
                    {language === 'bn' ? 'এই দাগের জন্য অফিসিয়াল সরকারি দলিলের অনুলিপি চান?' : 'Need an Official Certified Record for this Plot?'}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'bn'
                      ? 'সহকারী কমিশনার (ভূমি) ও সাব-রেজিস্ট্রি থেকে অনুমোদিত খতিয়ান বা দলিলের সার্টিফাইড অনুলিপি পেতে অনলাইনে আবেদন করুন।'
                      : 'Obtain legally certified Khatian extracts, Porcha copies, or AC Land mutation sheets verified by authorized land officers.'}
                  </p>
                </div>

                {currentRecord && (
                  <Link
                    href={`/apply?district=${encodeURIComponent(currentRecord.district)}&upazila=${encodeURIComponent(currentRecord.upazila)}&mouza=${encodeURIComponent(currentRecord.mouza)}&khatianNo=${encodeURIComponent(currentRecord.khatianNo)}&dagNo=${encodeURIComponent(currentRecord.dagNo)}&jlNumber=${encodeURIComponent(currentRecord.jlNumber)}`}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>{language === 'bn' ? 'দলিলের জন্য আবেদন করুন' : 'Apply for Official Document'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Detailed Itemized Findings */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <span>{t.riskFindingsTitle}</span>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {language === 'bn'
                  ? `${toBanglaNumber(verification.findings.length)}টি বিষয় চিহ্নিত`
                  : `${verification.findings.length} findings`}
              </span>
            </div>

            {verification.findings.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/60 rounded-2xl border border-emerald-100 text-emerald-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <h4 className="font-bold text-sm">{t.riskNoIssues}</h4>
              </div>
            ) : (
              <div className="space-y-4">
                {verification.findings.map((f) => {
                  const isHigh = f.severity === 'high';
                  const isMed = f.severity === 'medium';
                  return (
                    <div
                      key={f.id}
                      className={`p-5 rounded-2xl border space-y-3 transition-colors ${
                        isHigh
                          ? 'bg-rose-50/30 border-rose-200'
                          : isMed
                          ? 'bg-amber-50/30 border-amber-200'
                          : 'bg-emerald-50/30 border-emerald-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded">
                            {f.ruleCode}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">
                            {language === 'bn' ? f.titleBn : f.titleEn}
                          </h4>
                        </div>
                        <RiskBadge severity={f.severity} size="sm" />
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">
                          {language === 'bn' ? 'কারণ:' : 'Reason:'}
                        </strong>{' '}
                        {language === 'bn' ? f.reasonBn : f.reasonEn}
                      </div>

                      <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-200/60">
                        <span className="font-semibold text-slate-700">
                          {t.riskEvidence}:
                        </span>{' '}
                        {language === 'bn' ? f.evidenceBn : f.evidence}
                      </div>

                      <div className="text-xs font-medium text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-start gap-2">
                        <Scale className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>{t.riskNextSteps}:</strong>{' '}
                          {language === 'bn' ? f.recommendedStepsBn : f.recommendedStepsEn}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buyer Action Checklist */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{t.checklistTitle}</span>
            </div>

            <div className="space-y-3">
              {(language === 'bn' ? verification.buyerChecklistBn : verification.buyerChecklistEn).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 text-xs text-slate-500 space-y-1">
            <h5 className="font-bold uppercase tracking-wider text-slate-600">
              {t.riskLegalDisclaimerTitle}
            </h5>
            <p className="leading-relaxed">
              {language === 'bn' ? verification.disclaimerBn : verification.disclaimerEn}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading Screener...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
