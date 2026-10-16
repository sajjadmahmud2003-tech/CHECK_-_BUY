'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldAlert, Info } from 'lucide-react';

export default function DemoBanner() {
  const { language } = useLanguage();

  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 text-xs font-medium py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
          <span>
            {language === 'bn' ? (
              <>
                <strong className="font-bold">নমুনা ডাটা মোড:</strong> জমি ক্রয়পূর্ব ঝুঁকি পরীক্ষণ ডেমো সিস্টেম। নাগরিকের গোপনীয়তা রক্ষার্থে সমস্ত রেকর্ড ও নাম কাল্পনিক ও পরীক্ষামূলক।
              </>
            ) : (
              <>
                <strong className="font-bold">DEMO & SAMPLE DATA MODE:</strong> Citizen pre-purchase risk screening evaluation system. All records are simulated for demonstration. Not an official government title deed.
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] bg-amber-600/30 px-2 py-0.5 rounded text-slate-950 font-semibold shrink-0">
          <Info className="w-3.5 h-3.5" />
          <span>GovTech Verification • Check Before You Buy</span>
        </div>
      </div>
    </div>
  );
}
