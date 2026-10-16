'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { dataStore } from '@/lib/data-store';
import { LandRecord, SearchFilters } from '@/types';
import RiskBadge from '@/components/RiskBadge';
import { toBanglaNumber, formatArea, BANGLADESH_DISTRICTS } from '@/lib/bangla-utils';
import {
  Search,
  Filter,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';

function SearchContent() {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [district, setDistrict] = useState<string>('all');
  const [upazila, setUpazila] = useState<string>('');
  const [mouza, setMouza] = useState<string>('');
  const [dagNo, setDagNo] = useState<string>(initialQuery);
  const [khatianNo, setKhatianNo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'has_issues'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [sortBy, setSortBy] = useState<'dag' | 'area' | 'mouza'>('dag');

  const filteredRecords = useMemo(() => {
    const filters: SearchFilters = {
      district: district !== 'all' ? district : undefined,
      upazila: upazila.trim() || undefined,
      mouza: mouza.trim() || undefined,
      dagNo: dagNo.trim() || undefined,
      khatianNo: khatianNo.trim() || undefined,
      statusFilter,
    };

    const results = dataStore.getRecords(filters);

    results.sort((a, b) => {
      if (sortBy === 'area') return b.areaDecimals - a.areaDecimals;
      if (sortBy === 'mouza') return a.mouza.localeCompare(b.mouza);
      return parseInt(a.dagNo || '0') - parseInt(b.dagNo || '0');
    });

    return results;
  }, [district, upazila, mouza, dagNo, khatianNo, statusFilter, sortBy]);

  const handleReset = () => {
    setDistrict('all');
    setUpazila('');
    setMouza('');
    setDagNo('');
    setKhatianNo('');
    setStatusFilter('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.searchTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.searchSubtitle}</p>
        </div>

        {/* View Switcher & Counter */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold">
            {language === 'bn' ? toBanglaNumber(filteredRecords.length) : filteredRecords.length}{' '}
            {t.searchFound}
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'অনুসন্ধান ও ফিল্টার' : 'Search Criteria & Filters'}</span>
          </div>
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.btnReset}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* District */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.searchDistrict}
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">{t.searchAllDistricts}</option>
              {BANGLADESH_DISTRICTS.map((d) => (
                <option key={d.en} value={d.en}>
                  {language === 'bn' ? d.bn : d.en}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.searchUpazila}
            </label>
            <input
              type="text"
              value={upazila}
              onChange={(e) => setUpazila(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: ধানমন্ডি' : 'e.g. Dhanmondi'}
              className="w-full bg-white text-slate-900 placeholder:text-slate-500 border border-slate-300 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Mouza */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.searchMouza}
            </label>
            <input
              type="text"
              value={mouza}
              onChange={(e) => setMouza(e.target.value)}
              placeholder={language === 'bn' ? 'যেমন: বাউনিয়া' : 'e.g. Bawnia'}
              className="w-full bg-white text-slate-900 placeholder:text-slate-500 border border-slate-300 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Dag No */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.searchDag}
            </label>
            <input
              type="text"
              value={dagNo}
              onChange={(e) => setDagNo(e.target.value)}
              placeholder="e.g. 405, 1204"
              className="w-full bg-white text-slate-900 placeholder:text-slate-500 border border-slate-300 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Khatian No */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.searchKhatian}
            </label>
            <input
              type="text"
              value={khatianNo}
              onChange={(e) => setKhatianNo(e.target.value)}
              placeholder="e.g. 108, 542"
              className="w-full bg-white text-slate-900 placeholder:text-slate-500 border border-slate-300 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {t.searchFilterStatus}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-white text-slate-900 border border-slate-300 text-xs rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">{t.searchFilterAll}</option>
              <option value="clean">{t.searchFilterClean}</option>
              <option value="has_issues">{t.searchFilterIssues}</option>
            </select>
          </div>
        </div>

        {/* Quick Demo Presets */}
        <div className="pt-2 flex items-center flex-wrap gap-2 text-xs">
          <span className="text-slate-400 font-medium">{t.searchDemoChips}</span>
          <button
            onClick={() => {
              setDistrict('Dhaka');
              setDagNo('405');
            }}
            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer"
          >
            Dhanmondi (Dag 405)
          </button>
          <button
            onClick={() => {
              setDistrict('Dhaka');
              setDagNo('1204');
            }}
            className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold cursor-pointer"
          >
            Gulshan (Dag 1204)
          </button>
          <button
            onClick={() => {
              setDistrict('Dhaka');
              setDagNo('870');
            }}
            className="px-2 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold cursor-pointer"
          >
            Uttara (Dag 870)
          </button>
          <button
            onClick={() => {
              setDistrict('Chattogram');
              setDagNo('310');
            }}
            className="px-2 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-semibold cursor-pointer"
          >
            Chattogram (Dag 310)
          </button>
        </div>
      </div>

      {/* Results View */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t.searchNoResults}</h3>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
          >
            {t.btnReset}
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((rec) => {
            const isClean = !rec.hasCaveatOrDispute && rec.mutation?.status === 'approved';
            const riskLevel = isClean ? 'low' : rec.hasCaveatOrDispute ? 'high' : 'medium';

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
                    <RiskBadge severity={riskLevel} size="sm" />
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
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{t.searchTableColLocation}</th>
                <th className="py-3 px-3">{t.searchTableColSurvey}</th>
                <th className="py-3 px-3">{t.searchTableColDag}</th>
                <th className="py-3 px-3">{t.searchTableColArea}</th>
                <th className="py-3 px-4">{t.searchTableColOwner}</th>
                <th className="py-3 px-3">{t.searchTableColRisk}</th>
                <th className="py-3 px-4 text-right">{t.searchTableColAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => {
                const isClean = !rec.hasCaveatOrDispute && rec.mutation?.status === 'approved';
                const riskLevel = isClean ? 'low' : rec.hasCaveatOrDispute ? 'high' : 'medium';
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {language === 'bn' ? rec.mouzaBn : rec.mouza}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {language === 'bn'
                          ? `${rec.upazilaBn}, ${rec.districtBn}`
                          : `${rec.upazila}, ${rec.district}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-800">{rec.currentSurvey}</div>
                      <div className="text-[10px] text-slate-500">
                        Khatian #{language === 'bn' ? toBanglaNumber(rec.khatianNo) : rec.khatianNo}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {language === 'bn' ? toBanglaNumber(rec.dagNo) : rec.dagNo}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-800">
                      {formatArea(rec.areaDecimals, language)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {language === 'bn' ? rec.owners[0]?.ownerNameBn : rec.owners[0]?.ownerName}
                    </td>
                    <td className="py-3.5 px-3">
                      <RiskBadge severity={riskLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/records/${rec.id}`}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                        >
                          {t.btnViewDetails}
                        </Link>
                        <Link
                          href={`/verify?recordId=${rec.id}`}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                        >
                          {t.btnVerifyNow}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading Search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
