'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { dataStore } from '@/lib/data-store';
import { parseBanglaLandText, DEMO_DOCUMENTS } from '@/lib/ocr-service';
import { ExtractedDocumentFields, DocumentRecord } from '@/types';
import { toBanglaNumber, formatArea } from '@/lib/bangla-utils';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';

export default function DocumentUploadPage() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [extractedFields, setExtractedFields] = useState<ExtractedDocumentFields | null>(null);
  const [matchedRecordId, setMatchedRecordId] = useState<string | null>(null);

  // Editable fields state for citizen review
  const [editMouza, setEditMouza] = useState('');
  const [editDagNo, setEditDagNo] = useState('');
  const [editKhatianNo, setEditKhatianNo] = useState('');
  const [editArea, setEditArea] = useState<number | ''>('');
  const [editDeedNo, setEditDeedNo] = useState('');
  const [editOwners, setEditOwners] = useState('');

  const processText = (text: string, name: string) => {
    setIsProcessing(true);
    setProcessingProgress(20);

    const timer1 = setTimeout(() => {
      setProcessingProgress(65);
    }, 400);

    const timer2 = setTimeout(() => {
      const parsed = parseBanglaLandText(text);
      setRawOcrText(text);
      setExtractedFields(parsed);

      setEditMouza(parsed.mouza || '');
      setEditDagNo(parsed.dagNo || '');
      setEditKhatianNo(parsed.khatianNo || '');
      setEditArea(parsed.areaDecimals || '');
      setEditDeedNo(parsed.deedNo || '');
      setEditOwners(parsed.ownerNames.join(', ') || '');

      // Check if matches any existing mock record
      if (parsed.dagNo) {
        const found = dataStore.getRecords({ dagNo: parsed.dagNo });
        if (found.length > 0) {
          setMatchedRecordId(found[0].id);
        }
      }

      // Save document to store
      const newDoc: DocumentRecord = {
        id: `doc-${Date.now()}`,
        userId: user?.id || 'citizen-demo',
        fileName: name,
        fileUrl: '/documents/sample-deed.pdf',
        fileSize: 1024 * 450,
        mimeType: 'application/pdf',
        documentType: 'deed',
        rawOcrText: text,
        extractedFields: parsed,
        reviewStatus: 'reviewed',
        createdAt: new Date().toISOString(),
      };
      dataStore.addDocument(newDoc);

      setProcessingProgress(100);
      setIsProcessing(false);
    }, 900);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a valid PDF, JPEG, or PNG document.');
      return;
    }
    // Validate size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(selectedFile.size);

    // Mock OCR text with realistic extracted content from file
    const sampleText = DEMO_DOCUMENTS[0].rawText;
    processText(sampleText, selectedFile.name);
  };

  const loadPreset = (presetIndex: number) => {
    const preset = DEMO_DOCUMENTS[presetIndex];
    setFileName(preset.nameEn);
    setFileSize(512000);
    processText(preset.rawText, preset.nameEn);
  };

  const handleCrossCheck = () => {
    if (matchedRecordId) {
      router.push(`/records/${matchedRecordId}`);
    } else if (editDagNo) {
      router.push(`/search?q=${encodeURIComponent(editDagNo)}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.uploadTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.uploadSubtitle}</p>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-2xl p-8 text-center transition-colors cursor-pointer relative"
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">{t.uploadDropzone}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.uploadFormats}</p>
            </div>
            {fileName && (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-full">
                📄 {fileName} ({(fileSize / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>
        </div>

        {/* Demo Preset Buttons for Hackathon Judges */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
          <span className="text-xs text-slate-500 font-semibold">
            {language === 'bn' ? 'দ্রুত পরীক্ষামূলক নমুনা:' : 'Or Try Realistic Demo Documents:'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadPreset(0)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
            >
              📄 {t.uploadSampleDoc1}
            </button>
            <button
              onClick={() => loadPreset(1)}
              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold transition-colors cursor-pointer"
            >
              📄 {t.uploadSampleDoc2}
            </button>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>{t.uploadProcessing}</span>
              </span>
              <span>{processingProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Extracted Fields & Side-by-Side Review */}
      {extractedFields && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">
                {language === 'bn' ? 'গুরুত্বপূর্ণ নাগরিক নির্দেশনা:' : 'Citizen Verification Notice:'}
              </strong>{' '}
              {t.uploadReviewPrompt}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Raw Text Display */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{t.uploadRawText}</span>
                </div>
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Confidence: {(extractedFields.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
              <textarea
                value={rawOcrText}
                readOnly
                rows={12}
                className="w-full bg-slate-50 text-slate-800 font-mono text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-hidden leading-relaxed resize-none"
              />
            </div>

            {/* Right: Editable Candidate Fields */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>{t.uploadExtractedData}</span>
                </div>
                <span className="text-xs text-slate-400">Editable</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'মৌজার নাম' : 'Mouza'}
                  </label>
                  <input
                    type="text"
                    value={editMouza}
                    onChange={(e) => setEditMouza(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'দাগ নম্বর (Dag No)' : 'Dag No'}
                    </label>
                    <input
                      type="text"
                      value={editDagNo}
                      onChange={(e) => setEditDagNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'খতিয়ান নম্বর (Khatian No)' : 'Khatian No'}
                    </label>
                    <input
                      type="text"
                      value={editKhatianNo}
                      onChange={(e) => setEditKhatianNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'জমির পরিমাণ (শতক)' : 'Area (Decimals)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {language === 'bn' ? 'দলিল নম্বর' : 'Deed / Doc No'}
                    </label>
                    <input
                      type="text"
                      value={editDeedNo}
                      onChange={(e) => setEditDeedNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'মালিক / গ্রহীতা' : 'Owner / Buyer Name(s)'}
                  </label>
                  <input
                    type="text"
                    value={editOwners}
                    onChange={(e) => setEditOwners(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {matchedRecordId && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {language === 'bn'
                        ? `মিল পাওয়া গেছে: ডাটাবেজে দাগ নং ${editDagNo}-এর রেকর্ড সংরক্ষিত আছে!`
                        : `Registry Match Found: Dag #${editDagNo} exists in land database!`}
                    </span>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    onClick={handleCrossCheck}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t.uploadVerifyBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
