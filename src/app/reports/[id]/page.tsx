'use client';

import React, { use, Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { dataStore } from '@/lib/data-store';
import { generateVerificationPdf } from '@/lib/pdf-generator';
import { toBanglaNumber, formatArea, formatDate } from '@/lib/bangla-utils';
import LandChainTable from '@/components/LandChainTable';
import RiskBadge from '@/components/RiskBadge';
import {
  Download,
  Printer,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Scale,
  QrCode,
  Building,
} from 'lucide-react';

function ReportViewerContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { language, t } = useLanguage();

  const verification = dataStore.getVerificationById(id);

  if (!verification) {
    notFound();
  }

  const record = verification.landRecord;

  const handleDownload = () => {
    generateVerificationPdf(verification, language);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {record && (
            <Link
              href={`/apply?district=${encodeURIComponent(record.district)}&upazila=${encodeURIComponent(record.upazila)}&mouza=${encodeURIComponent(record.mouza)}&khatianNo=${encodeURIComponent(record.khatianNo)}&dagNo=${encodeURIComponent(record.dagNo)}&jlNumber=${encodeURIComponent(record.jlNumber)}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'অফিসিয়াল দলিলের আবেদন' : 'Apply for Official Document'}</span>
            </Link>
          )}
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Download unofficial risk screening report"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>{language === 'bn' ? 'ডেমো ঝুঁকি রিপোর্ট (অনানুষ্ঠানিক)' : 'Demo Risk Report (Unofficial)'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.btnPrintReport}</span>
          </button>
        </div>
      </div>

      {/* Official GovTech Dossier Sheet */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Unofficial Banner Warning */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {language === 'bn'
                ? 'অনানুষ্ঠানিক ডেমো বিশ্লেষণ: এই প্রতিবেদনটি জমি ক্রয়ের পূর্বে প্রাথমিক সতর্কতামূলক ঝুঁকি স্ক্রিনিং। এটি কোনো সরকারি খতিয়ান বা আইনি সনদ নয়।'
                : 'Unofficial Demo Screening: This report is an analytical pre-purchase risk dossier and NOT an official government title document.'}
            </span>
          </div>
          {record && (
            <Link
              href={`/apply?district=${encodeURIComponent(record.district)}&upazila=${encodeURIComponent(record.upazila)}&mouza=${encodeURIComponent(record.mouza)}&khatianNo=${encodeURIComponent(record.khatianNo)}&dagNo=${encodeURIComponent(record.dagNo)}&jlNumber=${encodeURIComponent(record.jlNumber)}`}
              className="text-emerald-800 hover:underline font-bold shrink-0 text-[11px]"
            >
              {language === 'bn' ? 'অফিসিয়াল কপি চান? আবেদন করুন →' : 'Need Official Record? Apply →'}
            </Link>
          )}
        </div>

        {/* Dossier Header */}
        <div className="border-b-2 border-emerald-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider">
              CHECK_&_BUY • Bangladesh Land Due Diligence Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'bn'
                ? 'নাগরিক ক্রয়পূর্ব ভূমি যাচাই প্রতিবেদন (ডেমো স্ক্রিনিং)'
                : 'CITIZEN PRE-PURCHASE RISK DOSSIER (DEMO SCREENING)'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Landtech Innovation Hackathon 2026 • Problem Statement P5: Check Before You Buy
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 shrink-0 flex flex-col items-end">
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-2 text-slate-700">
              <QrCode className="w-full h-full text-slate-800" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 mt-1">
              {verification.verificationCode}
            </span>
          </div>
        </div>

        {/* Verification Status Summary Box */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Overall Assessment</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              Risk Score: {verification.overallScore} / 100
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Generated: {formatDate(verification.createdAt, language)}
            </div>
          </div>
          <RiskBadge severity={verification.overallLevel} size="lg" />
        </div>

        {/* Property Particulars */}
        {record && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-2">
              1. Property Identification & Registry Particulars
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{record.mouza}</span>
                <span className="text-[10px] text-slate-500">
                  {record.upazila}, {record.district}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Dag & Khatian</span>
                <span className="font-bold text-slate-800 mt-0.5 block">Dag #{record.dagNo}</span>
                <span className="text-[10px] text-slate-500">Khatian #{record.khatianNo}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Recorded Area</span>
                <span className="font-bold text-emerald-800 mt-0.5 block">
                  {formatArea(record.areaDecimals, language)}
                </span>
                <span className="text-[10px] text-slate-500">{record.landClass}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-medium">Mutation Status</span>
                <span className="font-bold text-slate-800 mt-0.5 block uppercase">
                  {record.mutation?.status || 'None'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Case: {record.mutation?.caseNo || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Survey Lineage Table */}
        {record?.surveys && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-2">
              2. Historical Survey Chain (CS → SA → RS → BS)
            </h3>
            <LandChainTable surveys={record.surveys} />
          </div>
        )}

        {/* Risk Screening Findings */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-2">
            3. Risk Screening Findings & Red Flags
          </h3>
          {verification.findings.length === 0 ? (
            <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 font-medium">
              No title discrepancies or administrative caveats detected in available records.
            </div>
          ) : (
            <div className="space-y-3">
              {verification.findings.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      [{f.ruleCode}] {language === 'bn' ? f.titleBn : f.titleEn}
                    </span>
                    <RiskBadge severity={f.severity} size="sm" />
                  </div>
                  <div className="text-slate-600">
                    <strong>Reason:</strong> {language === 'bn' ? f.reasonBn : f.reasonEn}
                  </div>
                  <div className="text-slate-600">
                    <strong>Evidence:</strong> {language === 'bn' ? f.evidenceBn : f.evidence}
                  </div>
                  <div className="text-emerald-800 font-semibold">
                    <strong>Recommended Citizen Action:</strong>{' '}
                    {language === 'bn' ? f.recommendedStepsBn : f.recommendedStepsEn}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Essential Buyer Action Checklist */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-2">
            4. Buyer Action Checklist
          </h3>
          <div className="space-y-2 text-xs text-slate-700">
            {(language === 'bn' ? verification.buyerChecklistBn : verification.buyerChecklistEn).map(
              (item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">[ ]</span>
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Official Disclaimer */}
        <div className="border-t border-slate-200 pt-6 text-[11px] text-slate-400 space-y-1 leading-relaxed">
          <div className="font-bold uppercase tracking-wider text-slate-600">
            Mandatory Legal Disclaimer:
          </div>
          <p>
            {language === 'bn' ? verification.disclaimerBn : verification.disclaimerEn}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ReportViewerPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-12 text-center text-xs text-slate-500">
          Loading Verification Dossier...
        </div>
      }
    >
      <ReportViewerContent {...props} />
    </Suspense>
  );
}
