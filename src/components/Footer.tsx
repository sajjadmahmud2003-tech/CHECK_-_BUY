'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, ExternalLink, HelpCircle, FileCheck2, Scale } from 'lucide-react';

export default function Footer() {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-100" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">{t.brandName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t.footerDesc}
            </p>
            <div className="pt-2">
              <span className="inline-block text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                Hackathon P5: Check Before You Buy
              </span>
            </div>
          </div>

          {/* Verification Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {language === 'bn' ? 'যাচাই সেবা' : 'Verification Tools'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  {t.navSearch}
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition-colors">
                  {t.navVerify}
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-white transition-colors">
                  {t.navUpload}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  {t.navDashboard}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  {t.navAdmin}
                </Link>
              </li>
            </ul>
          </div>

          {/* Bangladesh Land References */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {language === 'bn' ? 'ভূমি সংক্রান্ত সরকারি তথ্য' : 'Govt Land Resources'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>e-Mutation (mutation.land.gov.bd)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Scale className="w-3.5 h-3.5 text-emerald-500" />
                <span>Land Tax (ldtax.gov.bd)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>e-Khatian (dlrs.gov.bd)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Land Ministry Helpline 16122</span>
              </li>
            </ul>
          </div>

          {/* Legal & Hackathon Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {t.footerLegalHeader}
            </h4>
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3 text-[11px] leading-relaxed text-slate-400">
              {t.footerGovtDisclaimer}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>{t.footerCopyright}</p>
          <div className="flex items-center gap-4">
            <span>Next.js 16 • TypeScript • Tailwind</span>
            <span>Bangla Unicode • OCR Enabled</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
