'use client';

import React, { use, Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { dataStore } from '@/lib/data-store';
import { toBanglaNumber, formatArea, formatDate } from '@/lib/bangla-utils';
import LandChainTable from '@/components/LandChainTable';
import RiskBadge from '@/components/RiskBadge';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Building,
  CheckCircle2,
  FileCheck2,
  Scale,
  Sparkles,
} from 'lucide-react';

function RecordDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { language, t } = useLanguage();

  const record = dataStore.getRecordById(id);

  if (!record) {
    notFound();
  }

  const isClean = !record.hasCaveatOrDispute && record.mutation?.status === 'approved';
  const riskLevel = isClean ? 'low' : record.hasCaveatOrDispute ? 'high' : 'medium';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/search"
          className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'অনুসন্ধান তালিকায় ফিরুন' : 'Back to Search'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <RiskBadge severity={riskLevel} size="md" />
          <Link
            href={`/verify?recordId=${record.id}`}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.btnVerifyNow}</span>
          </Link>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>
                {language === 'bn'
                  ? `${record.upazilaBn}, ${record.districtBn} • জে.এল #${toBanglaNumber(record.jlNumber)}`
                  : `${record.upazila}, ${record.district} • J.L #${record.jlNumber}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {language === 'bn' ? record.mouzaBn : record.mouza}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              {language === 'bn' ? 'হালনাগাদ:' : 'Last Recorded:'}{' '}
              {formatDate(record.updatedAt, language)}
            </span>
          </div>
        </div>

        {/* Quick Spec Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">
              {language === 'bn' ? 'দাগ নম্বর' : 'Dag No'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {language === 'bn' ? toBanglaNumber(record.dagNo) : record.dagNo}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {record.currentSurvey} {language === 'bn' ? 'জরিপ' : 'Survey'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">
              {language === 'bn' ? 'খতিয়ান নম্বর' : 'Khatian No'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {language === 'bn' ? toBanglaNumber(record.khatianNo) : record.khatianNo}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {language === 'bn' ? 'হাল খতিয়ান' : 'Latest Registry'}
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
            <div className="text-[11px] text-emerald-800 font-semibold uppercase">
              {language === 'bn' ? 'রেকর্ডকৃত জমি' : 'Recorded Area'}
            </div>
            <div className="text-xl font-black text-emerald-900 mt-1">
              {formatArea(record.areaDecimals, language)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              {language === 'bn' ? record.landClassBn : record.landClass}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold uppercase">
              {language === 'bn' ? 'নামজারি অবস্থা' : 'Mutation Status'}
            </div>
            <div className="text-base font-bold text-slate-900 mt-1 uppercase">
              {record.mutation?.status || 'Missing'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Case: {record.mutation?.caseNo || 'None'}
            </div>
          </div>
        </div>

        {/* Dispute / Caveat Alert if present */}
        {record.hasCaveatOrDispute && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-900">
                {t.detailsDisputeAlert}
              </h4>
              <p className="text-xs leading-relaxed font-medium">
                {language === 'bn' ? record.disputeDetailsBn : record.disputeDetails}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recorded Owners Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          <User className="w-5 h-5 text-emerald-600" />
          <span>{t.detailsRecordedOwners}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {record.owners.map((owner) => (
            <div
              key={owner.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? owner.ownerNameBn : owner.ownerName}
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                  {owner.sharePortion}
                </span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  <span className="text-slate-400">
                    {language === 'bn' ? 'পিতা/স্বামীর নাম:' : 'Father / Husband:'}
                  </span>{' '}
                  {owner.fatherOrHusbandName}
                </div>
                <div>
                  <span className="text-slate-400">
                    {language === 'bn' ? 'মালিকানা প্রাপ্তি:' : 'Acquisition:'}
                  </span>{' '}
                  {owner.acquisitionType}
                </div>
                <div>
                  <span className="text-slate-400">
                    {language === 'bn' ? 'রেকর্ড ভুক্তির তারিখ:' : 'Recorded Date:'}
                  </span>{' '}
                  {formatDate(owner.recordedDate, language)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mutation & DCR Section */}
      {record.mutation && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            <span>{t.detailsMutationSummary}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block">{t.detailsCaseNo}</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {record.mutation.caseNo}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block">{t.detailsAcOffice}</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {record.mutation.acLandOffice}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block">{t.detailsLastTaxYear}</span>
              <span className="font-bold text-emerald-800 text-sm mt-0.5 block">
                {record.mutation.lastTaxPaidYear
                  ? language === 'bn'
                    ? toBanglaNumber(record.mutation.lastTaxPaidYear)
                    : record.mutation.lastTaxPaidYear
                  : 'N/A'}
              </span>
            </div>
          </div>

          {record.mutation.remarks && (
            <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-200 p-3 rounded-xl font-medium">
              ℹ️ {record.mutation.remarks}
            </div>
          )}
        </div>
      )}

      {/* Historical Survey Chain Comparison (CS -> SA -> RS -> BS) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Scale className="w-5 h-5 text-emerald-600" />
            <span>{t.detailsChainMatrix}</span>
          </div>
          <span className="text-xs text-slate-500">{t.detailsChainNote}</span>
        </div>

        <LandChainTable surveys={record.surveys} />
      </div>

      {/* Provenance & Disclaimer Card */}
      <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 text-xs text-slate-500 space-y-2">
        <div className="font-bold uppercase tracking-wider text-slate-600">
          {t.detailsProvenance}: {record.sourceProvenance}
        </div>
        <p className="leading-relaxed">
          {language === 'bn'
            ? 'বিজ্ঞপ্তি: এই রেকর্ডটি ল্যান্ডটেক ইনোভেশন হ্যাকাথন ২০২৬ প্রদর্শনীর জন্য তৈরি একটি কাল্পনিক নমুনা। কোনো নাগরিকের ব্যক্তিগত গোপনীয়তা ক্ষুণ্ণ করা হয়নি। কোনো জমি কেনার আগে রেজিস্ট্রি অফিস ও সংশ্লিষ্ট এসিল্যান্ড অফিসে সরেজমিন যাচাই করুন।'
            : 'Notice: This simulated entry demonstrates the multi-survey continuity verification engine. All names and boundaries are generated for hackathon benchmarking.'}
        </p>
      </div>
    </div>
  );
}

export default function RecordDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-12 text-center text-xs text-slate-500">
          Loading Land Record Details...
        </div>
      }
    >
      <RecordDetailsContent {...props} />
    </Suspense>
  );
}
