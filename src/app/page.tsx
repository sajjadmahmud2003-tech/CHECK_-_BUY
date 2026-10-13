'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Layers,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileCheck2,
  Scale,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { MOCK_LAND_RECORDS } from '@/lib/mock-data';
import RiskBadge from '@/components/RiskBadge';
import { toBanglaNumber, formatArea } from '@/lib/bangla-utils';

export default function HomePage() {
  const { language, t } = useLanguage();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const faqs = [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.govTechBadge}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            {t.heroHeadline}
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            {t.heroSubheadline}
          </p>

          {/* Interactive Search Bar in Hero */}
          <form
            onSubmit={handleHeroSearch}
            className="max-w-2xl mx-auto mt-6 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 text-emerald-400 absolute left-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.heroSearchPlaceholder}
                className="w-full bg-transparent text-white placeholder-slate-400 text-sm pl-11 pr-4 py-3 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>{t.btnSearch}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Case Chips */}
          <div className="pt-2 flex items-center justify-center flex-wrap gap-2 text-xs">
            <span className="text-slate-400">{t.searchDemoChips}</span>
            <Link
              href="/records/rec-dhanmondi-101"
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-emerald-600/40 border border-white/15 text-emerald-200 transition-colors"
            >
              ✅ {language === 'bn' ? 'ধানমন্ডি দাগ ৪০৫ (স্বচ্ছ)' : 'Dhanmondi Dag 405 (Clean)'}
            </Link>
            <Link
              href="/records/rec-gulshan-202"
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-amber-600/40 border border-white/15 text-amber-200 transition-colors"
            >
              ⚠️ {language === 'bn' ? 'গুলশান দাগ ১২০৪ (পরিমাণ গড়মিল)' : 'Gulshan Dag 1204 (Area Mismatch)'}
            </Link>
            <Link
              href="/records/rec-uttara-303"
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-rose-600/40 border border-white/15 text-rose-200 transition-colors"
            >
              🚨 {language === 'bn' ? 'উত্তরা দাগ ৮৭০ (মালিকানা বিরোধ)' : 'Uttara Dag 870 (Dispute)'}
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/search"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.heroPrimaryCta}</span>
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span>{t.heroSecondaryCta}</span>
            </a>
          </div>
        </div>

        {/* 4 Pillars of Trust Bar */}
        <div className="max-w-6xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {language === 'bn' ? toBanglaNumber(4) + 'টি জরিপ স্তর' : t.heroTrustStat1}
            </div>
            <div className="text-xs text-slate-400 mt-1">{t.heroTrustDesc1}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {language === 'bn' ? toBanglaNumber(7) + 'টি ঝুঁকি নিয়ম' : t.heroTrustStat2}
            </div>
            <div className="text-xs text-slate-400 mt-1">{t.heroTrustDesc2}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">{t.heroTrustStat3}</div>
            <div className="text-xs text-slate-400 mt-1">{t.heroTrustDesc3}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {language === 'bn' ? 'বাংলা ও ইংরেজি' : t.heroTrustStat4}
            </div>
            <div className="text-xs text-slate-400 mt-1">{t.heroTrustDesc4}</div>
          </div>
        </div>
      </section>

      {/* Featured Verified Demo Records Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-emerald-700">
                {language === 'bn' ? 'নমুনা জমি ডাটাবেজ' : 'Simulated Registry Database'}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {language === 'bn' ? 'পরীক্ষামূলক ভূমি কেস স্টাডিজ' : 'Sample Verification Case Studies'}
              </h2>
            </div>
            <Link
              href="/search"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start md:self-auto"
            >
              <span>{language === 'bn' ? 'সকল রেকর্ড দেখুন' : 'Explore All Records'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCK_LAND_RECORDS.slice(0, 3).map((rec) => {
              const isClean = !rec.hasCaveatOrDispute && rec.mutation?.status === 'approved';
              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {rec.currentSurvey} {language === 'bn' ? 'জরিপ' : 'Survey'}
                      </span>
                      <RiskBadge
                        severity={isClean ? 'low' : rec.hasCaveatOrDispute ? 'high' : 'medium'}
                        size="sm"
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {language === 'bn' ? rec.mouzaBn : rec.mouza}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {language === 'bn'
                          ? `${rec.upazilaBn}, ${rec.districtBn}`
                          : `${rec.upazila}, ${rec.district}`}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          {language === 'bn' ? 'দাগ নং' : 'Dag No'}
                        </div>
                        <div className="font-bold text-slate-800">
                          {language === 'bn' ? toBanglaNumber(rec.dagNo) : rec.dagNo}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          {language === 'bn' ? 'খতিয়ান' : 'Khatian'}
                        </div>
                        <div className="font-bold text-slate-800">
                          {language === 'bn' ? toBanglaNumber(rec.khatianNo) : rec.khatianNo}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">
                          {language === 'bn' ? 'পরিমাণ' : 'Area'}
                        </div>
                        <div className="font-bold text-emerald-800">
                          {language === 'bn' ? toBanglaNumber(rec.areaDecimals) + ' শতক' : `${rec.areaDecimals} dec`}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong className="font-semibold text-slate-700">
                        {language === 'bn' ? 'রেকর্ডকৃত মালিক:' : 'Recorded Owner:'}
                      </strong>{' '}
                      {language === 'bn' ? rec.owners[0]?.ownerNameBn : rec.owners[0]?.ownerName}
                    </div>

                    {rec.hasCaveatOrDispute && (
                      <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 font-medium">
                        ⚠️ {language === 'bn' ? rec.disputeDetailsBn : rec.disputeDetails}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/records/${rec.id}`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <span>{t.btnViewDetails}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/verify?recordId=${rec.id}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                    >
                      {t.btnVerifyNow}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs uppercase tracking-wider font-bold text-emerald-700">
              {language === 'bn' ? 'প্রযুক্তি ও সমাধান' : 'Platform Capabilities'}
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              {t.featuresTitle}
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6 text-emerald-700" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t.featChainTitle}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.featChainDesc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t.featAreaTitle}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.featAreaDesc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <FileCheck2 className="w-6 h-6 text-emerald-700" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t.featMutationTitle}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.featMutationDesc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <FileText className="w-6 h-6 text-teal-700" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t.featOcrTitle}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.featOcrDesc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Scale className="w-6 h-6 text-rose-700" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t.featRiskTitle}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.featRiskDesc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6 text-indigo-700" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t.featReportTitle}</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t.featReportDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs uppercase tracking-wider font-bold text-emerald-400">
              {language === 'bn' ? 'সহজ কর্মপ্রক্রিয়া' : 'Verification Workflow'}
            </h2>
            <h3 className="text-2xl sm:text-4xl font-extrabold">{t.howTitle}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="font-bold text-base text-emerald-300">{t.howStep1Title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{t.howStep1Desc}</p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="font-bold text-base text-emerald-300">{t.howStep2Title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{t.howStep2Desc}</p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="font-bold text-base text-emerald-300">{t.howStep3Title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{t.howStep3Desc}</p>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-3 relative">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                4
              </div>
              <h4 className="font-bold text-base text-emerald-300">{t.howStep4Title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{t.howStep4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer Checklist & Legal Awareness */}
      <section className="py-20 bg-emerald-50/50 border-b border-emerald-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200/80 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {t.checklistTitle}
                </h3>
                <p className="text-xs text-slate-500">{t.checklistSubtitle}</p>
              </div>
            </div>

            <div className="space-y-4">
              {[t.checkItem1, t.checkItem2, t.checkItem3, t.checkItem4, t.checkItem5].map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {language === 'bn' ? toBanglaNumber(index + 1) : index + 1}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {language === 'bn'
                  ? 'আপনার দলিলের ছবি আপলোড করে স্বয়ংক্রিয়ভাবে খতিয়ান ও দাগ মিলিয়ে নিন।'
                  : 'Upload your deed scan to automatically extract Dag & Khatian fields.'}
              </div>
              <Link
                href="/upload"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>{t.btnUploadDoc}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{t.faqTitle}</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
