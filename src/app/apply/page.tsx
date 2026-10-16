'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { BANGLADESH_DISTRICTS } from '@/lib/bangla-utils';
import {
  FileText,
  ShieldCheck,
  Send,
  Upload,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Clock,
  Building2,
  FileCheck2,
  X,
  FileWarning,
  Sparkles,
} from 'lucide-react';
import { ApplicationDocumentType, OwnershipRelation } from '@/types';

function ApplyDocumentContent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query Parameters prefill (from Risk Scanner)
  const paramDistrict = searchParams.get('district') || 'Dhaka';
  const paramUpazila = searchParams.get('upazila') || '';
  const paramMouza = searchParams.get('mouza') || '';
  const paramJlNumber = searchParams.get('jlNumber') || '';
  const paramKhatianNo = searchParams.get('khatianNo') || '';
  const paramDagNo = searchParams.get('dagNo') || '';
  const paramDocType = (searchParams.get('documentType') as ApplicationDocumentType) || 'khatian_copy';

  const isPrefilledFromScanner = Boolean(paramDagNo && paramKhatianNo);

  // Form State
  const [citizenName, setCitizenName] = useState(user?.fullName || '');
  const [citizenPhone, setCitizenPhone] = useState(user?.phone || '');
  const [citizenEmail, setCitizenEmail] = useState(user?.email || '');
  const [citizenNid, setCitizenNid] = useState('');

  const [district, setDistrict] = useState(paramDistrict);
  const [upazila, setUpazila] = useState(paramUpazila);
  const [mouza, setMouza] = useState(paramMouza);
  const [jlNumber, setJlNumber] = useState(paramJlNumber);
  const [khatianNo, setKhatianNo] = useState(paramKhatianNo);
  const [dagNo, setDagNo] = useState(paramDagNo);

  const [ownershipRelation, setOwnershipRelation] = useState<OwnershipRelation>('Owner');
  const [documentType, setDocumentType] = useState<ApplicationDocumentType>(paramDocType);
  const [purpose, setPurpose] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Attachments State
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<{ id: string; appNumber: string; date: string } | null>(null);

  const documentTypeOptions: { value: ApplicationDocumentType; en: string; bn: string; descEn: string; descBn: string }[] = [
    {
      value: 'khatian_copy',
      en: 'Certified Khatian Extract (CS / SA / RS / BS)',
      bn: 'খতিয়ানের সার্টিফাইড অনুলিপি (সিএস / এসএ / আরএস / বিএস)',
      descEn: 'Official survey ledger extract showing ownership history and recorded plot area.',
      descBn: 'মালিকানা ইতিহাস ও রেকর্ডভুক্ত জমির পরিমাণ সম্বলিত অফিসিয়াল জরিপ খতিয়ান।',
    },
    {
      value: 'porcha_record',
      en: 'Porcha Record Copy (পর্চা কপি)',
      bn: 'পর্চা অনুলিপি (রেকর্ড কপি)',
      descEn: 'Certified field survey draft / working sheet copy.',
      descBn: 'মাঠ জরিপের অনুমোদিত খসড়া কার্যপত্র বা পর্চা কপি।',
    },
    {
      value: 'mutation_order',
      en: 'Namzari / Mutation Order Sheet (নামজারি আদেশনামা)',
      bn: 'নামজারি / খারিজ আদেশনামা ও ডিসিআর',
      descEn: 'Official AC Land e-Mutation court order approval sheet.',
      descBn: 'সহকারী কমিশনার (ভূমি) কর্তৃক অনুমোদিত নামজারি ও খারিজের অফিসিয়াল আদেশপত্র।',
    },
    {
      value: 'dcr_duplicate',
      en: 'Duplicate DCR (Duplicate Carbon Receipt)',
      bn: 'ডিসিআর (Duplicate Carbon Receipt) অনুলিপি',
      descEn: 'Proof of government revenue fee payment for mutation.',
      descBn: 'নামজারি বাবদ সরকারি ফি প্রদানের সরকারি ডিসিআর রসিদের কপি।',
    },
    {
      value: 'certified_deed',
      en: 'Certified Deed Copy (দলিল নকল)',
      bn: 'রেজিস্ট্রেশন দলিলের সার্টিফাইড নকল',
      descEn: 'Certified extract of registered transfer deed from Sub-Registry archives.',
      descBn: 'সাব-রেজিস্ট্রি আর্কাইভ থেকে ইস্যুকৃত মূল রেজিস্ট্রি দলিলের সার্টিফাইড নকল।',
    },
    {
      value: 'land_clearance_certificate',
      en: 'Land Due Diligence Clearance Report',
      bn: 'ভূমি অনুসন্ধান ও দায়মুক্তি প্রতিবেদন',
      descEn: 'Comprehensive pre-purchase due diligence clearance certified by Land Officer.',
      descBn: 'ক্রয়পূর্ব অনুসন্ধান ও আইনি পর্যালোচনা সম্বলিত কর্মকর্তা সার্টিফাইড ক্লিয়ারেন্স রিপোর্ট।',
    },
  ];

  const handleValidateBeforeConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!citizenName.trim() || !citizenPhone.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে আবেদনকারীর পুরো নাম এবং মোবাইল নম্বর প্রদান করুন।'
          : 'Please enter your full name and contact mobile number.'
      );
      return;
    }

    if (!upazila.trim() || !mouza.trim() || !khatianNo.trim() || !dagNo.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'উপজেলা, মৌজা, খতিয়ান নম্বর এবং দাগ নম্বর পূরণ করা বাধ্যতামূলক।'
          : 'Upazila, Mouza, Khatian Number, and Dag/Plot Number are mandatory.'
      );
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে আবেদনের উদ্দেশ্য সংক্ষেপে উল্লেখ করুন।'
          : 'Please provide the purpose of your document application.'
      );
      return;
    }

    // Passed validation: open confirmation dialog
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        citizenName: citizenName.trim(),
        citizenPhone: citizenPhone.trim(),
        citizenEmail: citizenEmail.trim() || user?.email,
        citizenNid: citizenNid.trim() || undefined,
        district,
        upazila: upazila.trim(),
        mouza: mouza.trim(),
        jlNumber: jlNumber.trim() || undefined,
        khatianNo: khatianNo.trim(),
        dagNo: dagNo.trim(),
        ownershipRelation,
        documentType,
        purpose: purpose.trim(),
        additionalInfo: additionalInfo.trim() || undefined,
        attachments: attachmentFile
          ? [
              {
                fileName: attachmentFile.name,
                storageKey: `att-${Date.now()}-${attachmentFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
                fileType: attachmentFile.type || 'application/pdf',
                fileSize: attachmentFile.size,
                uploadedBy: user?.id || 'citizen-anonymous',
              },
            ]
          : [],
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || (language === 'bn' ? 'আবেদন জমা দিতে সমস্যা হয়েছে।' : 'Failed to submit application.'));
        setLoading(false);
        return;
      }

      setSubmittedApp({
        id: data.application.id,
        appNumber: data.application.applicationNumber,
        date: data.application.submittedAt,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (submittedApp) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 w-full">
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {language === 'bn' ? 'আবেদন সফলভাবে গৃহীত হয়েছে' : 'Application Received Successfully'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'bn' ? 'আপনার আবেদন ট্র্যাকিং আইডি' : 'Your Application Tracking ID'}
            </h1>
            <div className="inline-block bg-slate-900 text-emerald-400 font-mono text-xl sm:text-2xl font-black px-6 py-2.5 rounded-2xl shadow-inner mt-2">
              {submittedApp.appNumber}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed pt-2">
              {language === 'bn'
                ? 'আপনার আবেদনটি সংশ্লিষ্ট সহকারী কমিশনার (ভূমি) ও সাব-রেজিস্ট্রি কার্যালয়ে যাচাইয়ের জন্য অপেক্ষমান রয়েছে। ভূমি কর্মকর্তা যাচাই সম্পন্ন করলে আপনি ইন-অ্যাপ নোটিফিকেশন পাবেন।'
                : 'Your request has been queued for verification with the AC Land Office. You will receive an in-app notification once reviewed by the Land Officer.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="text-slate-500 font-medium">{language === 'bn' ? 'আবেদনের ধরন:' : 'Document Type:'}</span>
              <span className="font-bold text-slate-800">{documentType.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="text-slate-500 font-medium">{language === 'bn' ? 'জমির অবস্থান:' : 'Location:'}</span>
              <span className="font-bold text-slate-800">{upazila}, {district} (Dag #{dagNo})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">{language === 'bn' ? 'বর্তমান স্ট্যাটাস:' : 'Current Status:'}</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Pending
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/applications/${submittedApp.id}`}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>{language === 'bn' ? 'আবেদনের বিস্তারিত ও ট্র্যাকিং দেখুন' : 'Track Application Status'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/applications"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              {language === 'bn' ? 'আমার আবেদনসমূহ (My Applications)' : 'Go to My Applications'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>GovTech Bangladesh • Ministry of Land Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'ভূমি দলিলের সার্টিফাইড অনুলিপির আবেদন' : 'Apply for Certified Land Document'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            {language === 'bn'
              ? 'খতিয়ান, পর্চা, নামজারি আদেশনামা বা দলিলের ডিজিটাল সত্যায়িত অনুলিপি পেতে ফরমটি পূরণ করুন।'
              : 'Submit an official digital request for certified Khatian extracts, Porcha copies, Mutation orders, or registered deeds.'}
          </p>
        </div>

        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start sm:self-auto shrink-0"
        >
          <Clock className="w-4 h-4 text-slate-500" />
          <span>{language === 'bn' ? 'আমার আবেদনসমূহ' : 'My Applications'}</span>
        </Link>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">{errorMsg}</div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:underline font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Prefilled from Risk Scanner Banner */}
      {isPrefilledFromScanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">
              {language === 'bn' ? 'ঝুঁকি স্ক্রিনার থেকে স্বয়ংক্রিয় তথ্য পূরণ:' : 'Prefilled from Land Risk Scanner:'}
            </span>
            <p className="text-emerald-800">
              {language === 'bn'
                ? `মৌজা: ${mouza || paramMouza}, দাগ #${dagNo || paramDagNo}, খতিয়ান #${khatianNo || paramKhatianNo}-এর বিবরণ ফরমটিতে যুক্ত করা হয়েছে। প্রয়োজনীয় তথ্য যাচাই করে জমা দিন।`
                : `Property particulars for Mouza: ${mouza || paramMouza}, Dag #${dagNo || paramDagNo}, Khatian #${khatianNo || paramKhatianNo} have been transferred for your official document request.`}
            </p>
          </div>
        </div>
      )}

      {/* Main Application Form */}
      <form onSubmit={handleValidateBeforeConfirm} className="space-y-8">
        {/* Section 1: Document Selection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? '১. প্রয়োজনীয় দলিলের ধরন নির্বাচন' : '1. Required Document Type'}</span>
            <span className="text-rose-500">*</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {documentTypeOptions.map((opt) => (
              <label
                key={opt.value}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  documentType === opt.value
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="documentType"
                  value={opt.value}
                  checked={documentType === opt.value}
                  onChange={() => setDocumentType(opt.value)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 leading-snug">
                    {language === 'bn' ? opt.bn : opt.en}
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">
                    {language === 'bn' ? opt.descBn : opt.descEn}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section 2: Land Identification Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? '২. জমির তফসিল ও সনাক্তকরণ তথ্য' : '2. Land Schedule & Survey Identification'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'জেলা' : 'District'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d.en} value={d.en}>
                    {language === 'bn' ? d.bn : d.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'উপজেলা / সার্কেল' : 'Upazila / Circle'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: ধানমন্ডি / গুলশান' : 'e.g. Dhanmondi / Gulshan'}
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'মৌজা' : 'Mouza'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={mouza}
                onChange={(e) => setMouza(e.target.value)}
                placeholder={language === 'bn' ? 'যেমন: ধানমন্ডি আ/এ' : 'e.g. Dhanmondi R/A'}
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'জেএল নম্বর (প্রযোজ্য ক্ষেত্রে)' : 'JL Number (If applicable)'}
              </label>
              <input
                type="text"
                value={jlNumber}
                onChange={(e) => setJlNumber(e.target.value)}
                placeholder="102"
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'খতিয়ান নম্বর' : 'Khatian Number'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={khatianNo}
                onChange={(e) => setKhatianNo(e.target.value)}
                placeholder="95"
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'দাগ / প্লট নম্বর' : 'Dag / Plot Number'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={dagNo}
                onChange={(e) => setDagNo(e.target.value)}
                placeholder="405"
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Applicant Identity & Relation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? '৩. আবেদনকারীর পরিচয় ও সম্পর্কের বিবরণ' : '3. Applicant Identity & Ownership Relationship'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'আবেদনকারীর পুরো নাম' : 'Applicant Full Name'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={citizenPhone}
                onChange={(e) => setCitizenPhone(e.target.value)}
                placeholder="+880 1712-345678"
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <input
                type="email"
                value={citizenEmail}
                onChange={(e) => setCitizenEmail(e.target.value)}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর (এনআইডি)' : 'National ID (NID Number)'}
              </label>
              <input
                type="text"
                value={citizenNid}
                onChange={(e) => setCitizenNid(e.target.value)}
                placeholder="19872691234567890"
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {language === 'bn'
                  ? '🔒 এনআইডি শুধুমাত্র আবেদনকারীর পরিচয় প্রমাণের জন্য সুরক্ষিতভাবে সংরক্ষিত থাকে।'
                  : '🔒 Used strictly for identity verification against AC Land registry.'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'জমির সাথে আবেদনকারীর সম্পর্ক' : 'Relationship with the Land Title'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <select
                value={ownershipRelation}
                onChange={(e) => setOwnershipRelation(e.target.value as OwnershipRelation)}
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Owner">{language === 'bn' ? 'খতিয়ানভুক্ত মূল মালিক (Owner)' : 'Recorded Owner'}</option>
                <option value="Heir / Legal Successor">{language === 'bn' ? 'ওয়ারিশ / উত্তরাধিকারী (Legal Heir)' : 'Heir / Legal Successor'}</option>
                <option value="Prospective Buyer / Due Diligence">{language === 'bn' ? 'সম্ভাব্য ক্রেতা / ক্রয়পূর্ব অনুসন্ধান (Buyer Due Diligence)' : 'Prospective Buyer / Due Diligence'}</option>
                <option value="Power of Attorney">{language === 'bn' ? 'আমমোক্তারনামাপ্রাপ্ত প্রতিনিধি (Power of Attorney)' : 'Power of Attorney'}</option>
                <option value="Authorized Representative">{language === 'bn' ? 'অনুমোদিত প্রতিনিধি / আইনজীবী (Legal Counsel)' : 'Authorized Representative'}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'আবেদনের উদ্দেশ্য' : 'Purpose of Application'}
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                placeholder={
                  language === 'bn'
                    ? 'যেমন: জমি ক্রয়পূর্ব মালিকানা যাচাই, ব্যাংক ঋণ বা উত্তরাধিকার বণ্টন...'
                    : 'e.g. Pre-purchase verification, bank financing, or succession partition...'
                }
                required
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                {language === 'bn' ? 'অতিরিক্ত তথ্য বা বিশেষ বিবরণ (ঐচ্ছিক)' : 'Additional Information (Optional)'}
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={2}
                placeholder={
                  language === 'bn'
                    ? 'পূর্ববর্তী জরিপের খতিয়ান নম্বর বা বিশেষ কোনো নির্দেশনা থাকলে লিখুন...'
                    : 'Any prior survey numbers, mutation case numbers, or notes for the Land Officer...'
                }
                className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Supporting Document Upload */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? '৪. সহায়ক প্রমাণক সংযুক্তি (ঐচ্ছিক)' : '4. Supporting Document Upload (Optional)'}</span>
          </div>

          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">
                {attachmentFile ? attachmentFile.name : (language === 'bn' ? 'এনআইডি, পূর্বের দলিলের কপি বা প্রমাণক ফাইল নির্বাচন করুন' : 'Upload NID copy, prior deed copy, or tax receipt')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'bn' ? 'অনুমোদিত ফরম্যাট: PDF, JPG, PNG (সর্বোচ্চ ১০ মেগাবাইট)' : 'Supported formats: PDF, JPG, PNG (Max 10 MB)'}
              </p>
              <input
                type="file"
                id="supporting-file-upload"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAttachmentFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="mt-4">
                <label
                  htmlFor="supporting-file-upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{attachmentFile ? (language === 'bn' ? 'ফাইল পরিবর্তন করুন' : 'Change File') : (language === 'bn' ? 'ফাইল বাছাই করুন' : 'Browse File')}</span>
                </label>
              </div>
            </div>

            {attachmentFile && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold truncate">{attachmentFile.name}</span>
                  <span className="text-[10px] text-slate-500">
                    ({(attachmentFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentFile(null)}
                  className="text-rose-600 hover:underline font-bold text-xs cursor-pointer ml-2"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 leading-relaxed text-center sm:text-left">
            <span className="font-semibold text-slate-700">🔒 GovTech Data Privacy:</span>{' '}
            {language === 'bn'
              ? 'আপনার তথ্য শুধুমাত্র সহকারী কমিশনার (ভূমি) যাচাই কার্যক্রমে ব্যবহৃত হবে।'
              : 'Your submission is encrypted and reviewed strictly by authorized Land Officers.'}
          </div>

          <button
            type="submit"
            id="apply-document-submit-btn"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <span>{language === 'bn' ? 'আবেদন পর্যালোচনা ও জমা দিন' : 'Review & Submit Application'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-base">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <span>{language === 'bn' ? 'আবেদন চূড়ান্ত নিশ্চিতকরণ' : 'Confirm Document Application'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'আবেদনের সেবা:' : 'Requested Service:'}</span>
                  <span className="font-bold text-slate-900">{documentType.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'আবেদনকারী:' : 'Applicant:'}</span>
                  <span className="font-bold text-slate-900">{citizenName} ({ownershipRelation})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'উপজেলা ও মৌজা:' : 'Location:'}</span>
                  <span className="font-bold text-slate-900">{upazila}, {mouza} ({district})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'খতিয়ান ও দাগ:' : 'Khatian / Dag:'}</span>
                  <span className="font-bold text-slate-900">Khatian #{khatianNo}, Dag #{dagNo}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                ⚠️ {language === 'bn'
                  ? 'জমা দেওয়ার পর আপনার আবেদনটি "Pending" অবস্থায় সহকারী কমিশনার (ভূমি) এর কর্মতালিকায় যুক্ত হবে।'
                  : 'Upon submission, your application will be queued as "Pending" for officer due diligence verification.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'পরিবর্তন করুন' : 'Edit Details'}
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? (language === 'bn' ? 'জমা হচ্ছে...' : 'Submitting...') : (language === 'bn' ? 'হ্যাঁ, চূড়ান্ত জমা দিন' : 'Confirm & Submit')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplyDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
          Loading Application Form...
        </div>
      }
    >
      <ApplyDocumentContent />
    </Suspense>
  );
}

