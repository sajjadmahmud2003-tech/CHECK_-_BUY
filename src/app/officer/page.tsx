'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { dataStore } from '@/lib/data-store';
import { DocumentRecord, LandApplication, ApplicationStatus, LandListing, ListingStatus, ListingVerificationStatus } from '@/types';
import { toBanglaNumber, formatDate, formatBdt } from '@/lib/bangla-utils';
import {
  FileText,
  Download,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  ArrowRight,
  AlertTriangle,
  Building2,
  Scale,
  Send,
  Upload,
  X,
  Loader2,
  FileCheck2,
  Eye,
  MessageSquare,
  AlertCircle,
  Paperclip,
  Tag,
  Sparkles,
  MapPin,
  Maximize2,
} from 'lucide-react';

export default function LandOfficerPage() {
  const { language } = useLanguage();
  const { user } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'queue' | 'archive' | 'marketplace'>('queue');

  // Applications Queue State
  const [applications, setApplications] = useState<LandApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appSearchQuery, setAppSearchQuery] = useState('');

  // Marketplace Moderation State
  const [marketListings, setMarketListings] = useState<LandListing[]>([]);
  const [loadingMarketListings, setLoadingMarketListings] = useState(false);
  const [marketStatusFilter, setMarketStatusFilter] = useState<string>('all');
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [selectedListingForReview, setSelectedListingForReview] = useState<LandListing | null>(null);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [reviewErrorMsg, setReviewErrorMsg] = useState<string | null>(null);
  const [reviewActionType, setReviewActionType] = useState<'approve' | 'correction' | 'reject'>('approve');
  const [reviewVerificationLevel, setReviewVerificationLevel] = useState<ListingVerificationStatus>('Officer Verified');
  const [reviewReasonText, setReviewReasonText] = useState('');
  const [reviewCorrectionText, setReviewCorrectionText] = useState('');

  // Selected Application for Review Modal
  const [selectedApp, setSelectedApp] = useState<LandApplication | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Modal Inputs
  const [correctionText, setCorrectionText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [internalNotesText, setInternalNotesText] = useState('');
  const [uploadPdfFile, setUploadPdfFile] = useState<File | null>(null);

  // Repository Documents State (Existing features)
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deed' | 'khatian' | 'mutation_order'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Load applications
  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.success && data.applications) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoadingApps(false);
    }
  };

  // Load marketplace listings for moderation
  const fetchMarketListings = async () => {
    setLoadingMarketListings(true);
    try {
      const res = await fetch('/api/marketplace/listings?status=all&sortBy=newest&limit=100');
      const data = await res.json();
      if (data.success && data.listings) {
        setMarketListings(data.listings);
      }
    } catch (err) {
      console.error('Failed to fetch market listings', err);
    } finally {
      setLoadingMarketListings(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'officer' || user?.role === 'admin') {
      fetchApplications();
      fetchMarketListings();
    }
  }, [user]);

  const handleModerateListing = async () => {
    if (!selectedListingForReview) return;
    setReviewActionLoading(true);
    setReviewErrorMsg(null);
    setReviewSuccessMsg(null);

    let newStatus: ListingStatus = 'Published';
    if (reviewActionType === 'correction') newStatus = 'Correction Required';
    if (reviewActionType === 'reject') newStatus = 'Rejected';

    try {
      const res = await fetch(`/api/marketplace/listings/${selectedListingForReview.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          verificationStatus: newStatus === 'Published' ? reviewVerificationLevel : undefined,
          verificationBadgeExplanation: newStatus === 'Published'
            ? reviewVerificationLevel === 'Officer Verified'
              ? 'Certified by Land Officer following title deeds & CS/RS record examination.'
              : 'Preliminary screening completed for marketplace listing.'
            : undefined,
          reason: reviewReasonText.trim() || undefined,
          correctionInstructions: reviewCorrectionText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setReviewErrorMsg(data.error || 'Failed to update listing moderation.');
        return;
      }

      setReviewSuccessMsg(`Listing ${selectedListingForReview.listingNumber} successfully updated to ${newStatus}.`);
      await fetchMarketListings();
      setTimeout(() => {
        setSelectedListingForReview(null);
        setReviewSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setReviewErrorMsg(err.message || 'Network error.');
    } finally {
      setReviewActionLoading(false);
    }
  };

  // ── Access Control Gate: Non-officers (Citizens and regular Admins) are forbidden ──
  if (!user || user.role !== 'officer') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সংরক্ষিত প্রবেশাধিকার' : 'Access Restricted'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {language === 'bn' ? 'ভূমি কর্মকর্তা শাখা — প্রবেশাধিকার সংরক্ষিত' : 'Land Officer Section — Access Restricted'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {language === 'bn'
                ? 'ভূমি মন্ত্রণালয় ডিজিটাল নিরাপত্তা প্রোটোকল অনুযায়ী এই শাখা এবং সংবেদনশীল দলিলের ডিজিটাল কপি ডাউনলোড শুধুমাত্র অনুমোদিত ভূমি কর্মকর্তা ও আইনজীবীদের জন্য সংরক্ষিত।'
                : 'Under Ministry of Land digital security directives, this repository and certified document downloads are strictly restricted to verified Land Officers and Legal Consultants.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto text-left text-xs space-y-1.5">
            <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              {language === 'bn' ? 'বর্তমান ব্যবহারকারী' : 'Current Signed-In Session'}
            </div>
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>{user?.fullName || (language === 'bn' ? 'অননুমোদিত নাগরিক' : 'Anonymous / Guest')}</span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold text-[11px]">
                {user?.role || 'Guest'}
              </span>
            </div>
            <p className="text-rose-600 text-[11px] font-medium pt-1">
              {language === 'bn'
                ? '❌ আপনার বর্তমান রোল এই পোর্টাল অ্যাক্সেস করার অনুমতি দেয় না।'
                : '❌ Your role does not have authorization to access this portal.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/officer/login"
              id="officer-access-denied-login-btn"
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>{language === 'bn' ? 'ভূমি কর্মকর্তা হিসেবে লগইন করুন' : 'Sign In as Land Officer'}</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-colors"
            >
              {language === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Officer Action Handlers ──
  const handleUpdateStatus = async (newStatus: ApplicationStatus, customParams?: any) => {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus,
          ...customParams,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionErrorMsg(data.error || 'Failed to update status.');
        setActionLoading(false);
        return;
      }

      setActionSuccessMsg(`Application status updated to ${newStatus}.`);
      setSelectedApp(data.application);
      await fetchApplications();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadOfficialPdf = async () => {
    if (!selectedApp || !uploadPdfFile) return;
    setActionLoading(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadPdfFile);

      const res = await fetch(`/api/applications/${selectedApp.id}/upload-document`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionErrorMsg(data.error || 'Failed to upload official PDF.');
        setActionLoading(false);
        return;
      }

      setActionSuccessMsg('Official certified PDF uploaded and released to citizen successfully.');
      setUploadPdfFile(null);
      await fetchApplications();
      // Reload selected app details
      const refreshRes = await fetch(`/api/applications/${selectedApp.id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) setSelectedApp(refreshData.application);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Network error uploading document.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Existing Documents Repository State & Download Handler ──
  const documents = dataStore.getDocuments();

  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.documentType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(q) ||
      (doc.extractedFields.mouza && doc.extractedFields.mouza.toLowerCase().includes(q)) ||
      (doc.extractedFields.dagNo && doc.extractedFields.dagNo.includes(q)) ||
      (doc.extractedFields.khatianNo && doc.extractedFields.khatianNo.includes(q)) ||
      doc.extractedFields.ownerNames.some((o) => o.toLowerCase().includes(q))
    );
  });

  const handleDownload = async (docId: string, fileName: string) => {
    setDownloadingId(docId);
    setDownloadError(null);

    try {
      const response = await fetch(`/api/documents/${docId}/download`, {
        method: 'GET',
        headers: {
          'x-user-id': user.id,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401 Unauthorized: Authentication required to download documents.');
        } else if (response.status === 403) {
          throw new Error('403 Forbidden: Document downloads are restricted to Land Officers.');
        } else {
          throw new Error(`Download failed with status ${response.status}`);
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    } catch (err: any) {
      setDownloadError(err.message || 'Error occurred while downloading document.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Queue Counters
  const countPending = applications.filter((a) => a.status === 'Pending').length;
  const countReview = applications.filter((a) => a.status === 'Under_Review').length;
  const countCorrection = applications.filter((a) => a.status === 'Correction_Required').length;
  const countApproved = applications.filter((a) => a.status === 'Approved').length;
  const countReady = applications.filter((a) => a.status === 'Document_Available').length;
  const countRejected = applications.filter((a) => a.status === 'Rejected').length;

  const filteredApps = applications.filter((a) => {
    if (appStatusFilter !== 'all' && a.status !== appStatusFilter) return false;
    if (appSearchQuery.trim()) {
      const q = appSearchQuery.toLowerCase();
      return (
        a.applicationNumber.toLowerCase().includes(q) ||
        a.citizenName.toLowerCase().includes(q) ||
        a.mouza.toLowerCase().includes(q) ||
        a.upazila.toLowerCase().includes(q) ||
        a.dagNo.includes(q) ||
        a.khatianNo.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header & Credentials Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-700/80 text-emerald-200 font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>{language === 'bn' ? 'অনুমোদিত ভূমি কর্মকর্তা পোর্টাল' : 'Certified Land Officer Portal'}</span>
              </span>
              <span className="text-xs text-emerald-300 font-mono">Officer: {user.fullName}</span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Directorate of Land Records & Surveys (DLRS)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {language === 'bn' ? 'ভূমি কর্মকর্তা ড্যাশবোর্ড ও অনুমোদন কনসোল' : 'Land Officer Dashboard & Approval Console'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl">
                {language === 'bn'
                  ? 'নাগরিকদের দাখিলকৃত দলিলের আবেদনসমূহ যাচাই, সংশোধন তলব, অনুমোদন এবং সার্টিফাইড ডিজিটাল পিডিএফ নথি আপলোড পোর্টাল।'
                  : 'Review citizen document requests, verify khatian chains, request corrections, approve records, and release certified PDFs.'}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center bg-slate-900/80 p-1.5 rounded-2xl border border-emerald-500/30 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {language === 'bn' ? 'আবেদন ও অনুমোদন কিউ' : 'Application Queue'} ({countPending + countReview})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('archive')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'archive'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {language === 'bn' ? 'সংরক্ষিত দলিল রিপোজিটরি' : 'Certified Archive'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'marketplace'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {language === 'bn' ? 'জমির বিজ্ঞাপন যাচাই' : 'Marketplace Moderation'} (
                {marketListings.filter((l) => l.status === 'Pending Review').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB 1: APPLICATION QUEUE & APPROVAL SYSTEM ── */}
      {activeTab === 'queue' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{applications.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-800 block">Pending</span>
              <span className="text-xl font-black text-amber-900 mt-1 block">{countPending}</span>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-blue-800 block">Under Review</span>
              <span className="text-xl font-black text-blue-900 mt-1 block">{countReview}</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-rose-800 block">Correction Req</span>
              <span className="text-xl font-black text-rose-900 mt-1 block">{countCorrection}</span>
            </div>
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-teal-800 block">Approved</span>
              <span className="text-xl font-black text-teal-900 mt-1 block">{countApproved}</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-800 block">PDF Released</span>
              <span className="text-xl font-black text-emerald-900 mt-1 block">{countReady}</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'Pending', label: 'Pending' },
                { id: 'Under_Review', label: 'Under Review' },
                { id: 'Correction_Required', label: 'Correction Req' },
                { id: 'Approved', label: 'Approved (Pending PDF)' },
                { id: 'Document_Available', label: 'Document Ready' },
                { id: 'Rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAppStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    appStatusFilter === tab.id
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                placeholder="Search citizen, Dag, ID..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3.5 px-4">Application ID</th>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Document Type</th>
                    <th className="py-3.5 px-4">Location & Plot</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submission Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{app.citizenName}</div>
                        <div className="text-[11px] text-slate-400">{app.citizenPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                        {app.documentType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{app.mouza}, {app.upazila}</div>
                        <div className="text-[11px] text-slate-400">Dag #{app.dagNo}, Khat #{app.khatianNo}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'Pending'
                              ? 'bg-amber-100 text-amber-900'
                              : app.status === 'Under_Review'
                              ? 'bg-blue-100 text-blue-900'
                              : app.status === 'Correction_Required'
                              ? 'bg-rose-100 text-rose-900'
                              : app.status === 'Approved'
                              ? 'bg-teal-100 text-teal-900'
                              : app.status === 'Document_Available'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatDate(app.submittedAt, language)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setActionSuccessMsg(null);
                            setActionErrorMsg(null);
                            setCorrectionText(app.correctionInstructions || '');
                            setRejectionReason(app.rejectionReason || '');
                            setInternalNotesText(app.internalNotes || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold border border-teal-200 transition-colors cursor-pointer"
                        >
                          Review & Action
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredApps.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No applications found in this queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CERTIFIED REPOSITORY (Existing Protected Document Downloads) ── */}
      {activeTab === 'archive' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Filter Type:</span>
              {(['all', 'deed', 'khatian', 'mutation_order'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    typeFilter === type
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repository..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Mouza & Plot</th>
                    <th className="py-3 px-4">Recorded Owner</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4 text-right">Download Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{doc.fileName}</td>
                      <td className="py-3 px-4 uppercase font-semibold text-slate-600">{doc.documentType}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {doc.extractedFields.mouza || 'N/A'} (Dag #{doc.extractedFields.dagNo || 'N/A'})
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {doc.extractedFields.ownerNames.join(', ') || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700">
                          {Math.round(doc.extractedFields.confidenceScore * 100)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc.id, doc.fileName)}
                          disabled={downloadingId === doc.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === doc.id ? 'Downloading...' : 'Download PDF'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MARKETPLACE MODERATION & LAND LISTING VERIFICATION ── */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Listings</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{marketListings.length}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 block uppercase">Pending Review</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">
                {marketListings.filter((l) => l.status === 'Pending Review' || l.status === 'Under Review').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 block uppercase">Published Live</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">
                {marketListings.filter((l) => l.status === 'Published').length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-2xs">
              <span className="text-[11px] font-bold text-rose-800 block uppercase">Action Required / Rejected</span>
              <span className="text-2xl font-black text-rose-900 mt-1 block">
                {marketListings.filter((l) => l.status === 'Correction Required' || l.status === 'Rejected').length}
              </span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={marketSearchQuery}
                onChange={(e) => setMarketSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'বিজ্ঞাপন নং, শিরোনাম, বা বিক্রেতা দিয়ে খুঁজুন...' : 'Filter listings by title, ID, mouza, or seller...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs">
              {['all', 'Pending Review', 'Published', 'Correction Required', 'Rejected'].map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setMarketStatusFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    marketStatusFilter === statusKey
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {statusKey === 'all' ? 'All' : statusKey}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Moderation Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Listing / Title</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Area & Location</th>
                    <th className="py-3 px-4">Price (BDT)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marketListings
                    .filter((item) => {
                      if (marketStatusFilter !== 'all' && item.status !== marketStatusFilter) return false;
                      if (!marketSearchQuery.trim()) return true;
                      const q = marketSearchQuery.toLowerCase();
                      return (
                        item.listingNumber.toLowerCase().includes(q) ||
                        item.title.toLowerCase().includes(q) ||
                        item.sellerName.toLowerCase().includes(q) ||
                        item.mouza.toLowerCase().includes(q) ||
                        item.district.toLowerCase().includes(q)
                      );
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.coverImage || '/images/properties/residential-plot.svg'}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <span className="font-mono text-[10px] text-slate-400 font-bold block">
                                {item.listingNumber}
                              </span>
                              <span className="font-bold text-slate-900 line-clamp-1 max-w-xs">
                                {item.title}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{item.sellerName}</span>
                          <span className="text-[10px] text-slate-400">{item.sellerPhone}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">
                            {item.areaValue} {item.areaUnit} ({item.propertyType})
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.mouza}, {item.upazila}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-emerald-800">
                          {formatBdt(item.priceBdt, language)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Pending Review'
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'Correction Required'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedListingForReview(item);
                              setReviewActionType('approve');
                              setReviewReasonText('');
                              setReviewCorrectionText('');
                              setReviewSuccessMsg(null);
                              setReviewErrorMsg(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Inspect & Moderate</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── OFFICER REVIEW & APPROVAL MODAL ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-base">
                    {selectedApp.applicationNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-800 uppercase">
                    {selectedApp.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applicant: <span className="font-semibold text-slate-700">{selectedApp.citizenName}</span> ({selectedApp.citizenPhone})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerts */}
            {actionSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {actionErrorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {/* Application Overview Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Requested Service</span>
                <span className="font-bold text-slate-900 capitalize block mt-0.5">{selectedApp.documentType.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedApp.mouza}, {selectedApp.upazila}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Plot & Khatian</span>
                <span className="font-bold text-slate-900 block mt-0.5">Dag #{selectedApp.dagNo}, Khat #{selectedApp.khatianNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ownership Relation</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedApp.ownershipRelation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Applicant NID</span>
                <span className="font-bold text-slate-900 block mt-0.5">{selectedApp.citizenNid || 'On Record'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Archive</span>
                <span className="font-bold text-slate-900 block mt-0.5 truncate">{selectedApp.assignedOffice}</span>
              </div>
            </div>

            {/* Purpose & Supporting Attachments */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Stated Application Purpose:</span>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 leading-relaxed">
                {selectedApp.purpose}
              </p>

              {selectedApp.attachments && selectedApp.attachments.length > 0 && (
                <div className="pt-2">
                  <span className="font-bold text-slate-700 block mb-1.5">Supporting Citizen Attachments:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                        <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold">{att.fileName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Officer Workflow Actions */}
            <div className="space-y-4 pt-3 border-t border-slate-200">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-700" />
                <span>Authorized Officer Decision & Actions</span>
              </div>

              {/* Status Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {selectedApp.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Under_Review', { reason: 'Officer initiated record inspection.' })}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer"
                  >
                    Start Review
                  </button>
                )}

                {selectedApp.status !== 'Approved' && selectedApp.status !== 'Document_Available' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to approve this application? This confirms survey consistency.')) {
                        handleUpdateStatus('Approved', { reason: 'Officer verified land title consistency and approved application.' });
                      }
                    }}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                  >
                    Approve Application
                  </button>
                )}

                {selectedApp.status !== 'Rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        alert('Please enter a written rejection reason below before rejecting.');
                        return;
                      }
                      if (confirm('Are you sure you want to reject this application?')) {
                        handleUpdateStatus('Rejected', { reason: rejectionReason });
                      }
                    }}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors cursor-pointer"
                  >
                    Reject Application
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!correctionText.trim()) {
                      alert('Please specify the required correction instructions below.');
                      return;
                    }
                    handleUpdateStatus('Correction_Required', {
                      correctionInstructions: correctionText,
                      reason: `Correction requested: ${correctionText}`,
                    });
                  }}
                  disabled={actionLoading}
                  className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer"
                >
                  Request Correction
                </button>
              </div>

              {/* Inputs for Corrections and Rejection Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correction Instructions (If requesting correction):
                  </label>
                  <textarea
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    rows={2}
                    placeholder="e.g. Please upload certified succession certificate or death certificate..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rejection Reason (If rejecting):
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. Title is disputed under Title Suit #402/2024 at Sub-Judge Court..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* PDF Document Release Section */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-teal-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-teal-700" />
                    <span>Upload Certified Official PDF for Citizen</span>
                  </div>
                  {selectedApp.officialDocument && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      Document Active: {selectedApp.officialDocument.fileName}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Only approved applications permit official document uploads. Once uploaded, the PDF is securely linked to the citizen's vault.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadPdfFile(e.target.files[0]);
                      }
                    }}
                    className="text-xs text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-teal-800 hover:file:bg-teal-100"
                  />

                  <button
                    type="button"
                    onClick={handleUploadOfficialPdf}
                    disabled={!uploadPdfFile || actionLoading}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Upload & Release PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MARKETPLACE LISTING INSPECTION & MODERATION MODAL ── */}
      {selectedListingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-900 text-base">
                    {selectedListingForReview.listingNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-800 uppercase">
                    {selectedListingForReview.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seller: <span className="font-semibold text-slate-700">{selectedListingForReview.sellerName}</span> ({selectedListingForReview.sellerPhone})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedListingForReview(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerts */}
            {reviewSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reviewSuccessMsg}</span>
              </div>
            )}

            {reviewErrorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reviewErrorMsg}</span>
              </div>
            )}

            {/* Listing Overview */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Property Title</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedListingForReview.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedListingForReview.mouza}, {selectedListingForReview.upazila}, {selectedListingForReview.district}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Asking Price</span>
                  <span className="font-extrabold text-emerald-700 block mt-0.5 text-sm">
                    {formatBdt(selectedListingForReview.priceBdt, language)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Area & Unit</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedListingForReview.areaValue} {selectedListingForReview.areaUnit} ({selectedListingForReview.propertyType})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Khatian & Dag</span>
                  <span className="font-bold text-slate-900 block mt-0.5 font-mono">
                    Dag #{selectedListingForReview.dagNo || 'N/A'}, Khat #{selectedListingForReview.khatianNo || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Road Access</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {selectedListingForReview.roadAccess || 'Standard Paved'}
                  </span>
                </div>
              </div>

              {/* Description & Narrative */}
              <div>
                <span className="font-bold text-slate-700 block mb-1">Description:</span>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedListingForReview.description}
                </p>
              </div>

              {/* Photos Preview */}
              {selectedListingForReview.images && selectedListingForReview.images.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Uploaded Photographs:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedListingForReview.images.map((img) => (
                      <div key={img.id} className="w-24 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
                        <img src={img.storagePath} alt="" className="w-full h-full object-cover" />
                        {img.isCover && (
                          <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-bold px-1 rounded">
                            COVER
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidential Supporting Documents */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-900">
                  <Lock className="w-4 h-4 text-teal-700" />
                  <span>Confidential Supporting Title Deeds (Officer Access Only)</span>
                </div>
                {selectedListingForReview.documents && selectedListingForReview.documents.length > 0 ? (
                  <div className="space-y-1">
                    {selectedListingForReview.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-teal-100 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span className="font-semibold text-slate-800">{doc.fileName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Secure Vault Key: {doc.storageKey}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-teal-700 italic">
                    No private supporting documents were uploaded by seller.
                  </p>
                )}
              </div>

              {/* Moderation Actions Form */}
              <div className="pt-2 border-t border-slate-200 space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Record Officer Moderation Decision
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewActionType('approve')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      reviewActionType === 'approve'
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    Approve & Publish
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewActionType('correction')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      reviewActionType === 'correction'
                        ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    Request Corrections
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewActionType('reject')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      reviewActionType === 'reject'
                        ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-semibold'
                    }`}
                  >
                    Reject Listing
                  </button>
                </div>

                {/* Conditional Fields based on action type */}
                {reviewActionType === 'approve' && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <label className="block font-bold text-emerald-900 text-xs">
                      Assign Verification Trust Level:
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800">
                        <input
                          type="radio"
                          name="vLevel"
                          checked={reviewVerificationLevel === 'Officer Verified'}
                          onChange={() => setReviewVerificationLevel('Officer Verified')}
                          className="text-emerald-600"
                        />
                        <span>Officer Verified (Full Land Registry Checked)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-800">
                        <input
                          type="radio"
                          name="vLevel"
                          checked={reviewVerificationLevel === 'Preliminary Review'}
                          onChange={() => setReviewVerificationLevel('Preliminary Review')}
                          className="text-emerald-600"
                        />
                        <span>Preliminary Review (Standard Screening)</span>
                      </label>
                    </div>
                  </div>
                )}

                {reviewActionType === 'correction' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-xs">
                      Correction Instructions for Seller *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewCorrectionText}
                      onChange={(e) => setReviewCorrectionText(e.target.value)}
                      placeholder="Specify what corrections or additional survey records are required..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                {reviewActionType === 'reject' && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-xs">
                      Rejection Reason *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewReasonText}
                      onChange={(e) => setReviewReasonText(e.target.value)}
                      placeholder="State legal reason or guideline violation for rejection..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedListingForReview(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={reviewActionLoading}
                onClick={handleModerateListing}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {reviewActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Moderation Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
