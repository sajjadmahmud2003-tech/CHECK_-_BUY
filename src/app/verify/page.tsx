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
import { LandRecord, VerificationResult, RiskSeverity } from '@/types';
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

  const handleDownloadPdf = () => {
    if (!verification) return;
    generateVerificationPdf(verification, language);
  };

  const handlePrint = () => {
    window.print();
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t.btnDownloadPdf}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
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
