'use client';

import React from 'react';
import { SurveyRecordItem } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { toBanglaNumber, formatArea, SURVEY_TYPES_MAP } from '@/lib/bangla-utils';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface LandChainTableProps {
  surveys: SurveyRecordItem[];
}

export default function LandChainTable({ surveys }: LandChainTableProps) {
  const { language } = useLanguage();

  const getStatusBadge = (status: SurveyRecordItem['verifiedStatus']) => {
    switch (status) {
      case 'consistent':
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{language === 'bn' ? 'ধারাবাহিক' : 'Consistent'}</span>
          </span>
        );
      case 'discrepancy':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>{language === 'bn' ? 'গড়মিল চিহ্নিত' : 'Discrepancy'}</span>
          </span>
        );
      case 'missing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>{language === 'bn' ? 'রেকর্ড নিখোঁজ' : 'Missing Link'}</span>
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
      <table className="w-full text-left text-xs text-slate-700">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">{language === 'bn' ? 'জরিপের স্তর' : 'Survey Level'}</th>
            <th className="py-3 px-3">{language === 'bn' ? 'সাল' : 'Year'}</th>
            <th className="py-3 px-3">{language === 'bn' ? 'খতিয়ান নং' : 'Khatian No'}</th>
            <th className="py-3 px-3">{language === 'bn' ? 'দাগ নং' : 'Dag No'}</th>
            <th className="py-3 px-4">{language === 'bn' ? 'রেকর্ডকৃত পরিমাণ' : 'Recorded Area'}</th>
            <th className="py-3 px-4">{language === 'bn' ? 'রেকর্ডভুক্ত মালিক' : 'Recorded Owner'}</th>
            <th className="py-3 px-4 text-center">{language === 'bn' ? 'ধারাবাহিকতা' : 'Chain Status'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {surveys.map((s, idx) => {
            const surveyInfo = SURVEY_TYPES_MAP[s.surveyType] || { nameEn: s.surveyType, nameBn: s.surveyType };
            const isDiscrepancy = s.verifiedStatus === 'discrepancy';
            const isMissing = s.verifiedStatus === 'missing';

            return (
              <tr
                key={idx}
                className={`transition-colors ${
                  isDiscrepancy
                    ? 'bg-amber-50/40 hover:bg-amber-50/70'
                    : isMissing
                    ? 'bg-rose-50/40 hover:bg-rose-50/70'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  <div className="flex flex-col">
                    <span className="text-emerald-900 font-bold">
                      {s.surveyType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {language === 'bn' ? surveyInfo.nameBn : surveyInfo.nameEn}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-slate-600 font-medium">
                  {language === 'bn' ? toBanglaNumber(s.year) : s.year}
                </td>
                <td className="py-3.5 px-3 font-semibold text-slate-900">
                  {language === 'bn' ? toBanglaNumber(s.khatianNo) : s.khatianNo}
                </td>
                <td className="py-3.5 px-3 font-semibold text-slate-900">
                  {language === 'bn' ? toBanglaNumber(s.dagNo) : s.dagNo}
                </td>
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  {s.areaDecimals > 0 ? (
                    formatArea(s.areaDecimals, language)
                  ) : (
                    <span className="text-slate-400 italic">{language === 'bn' ? 'অনুপস্থিত' : 'Missing'}</span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800">{s.recordedOwner}</div>
                  {s.remarks && (
                    <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                      ⚠️ {s.remarks}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {getStatusBadge(s.verifiedStatus)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
