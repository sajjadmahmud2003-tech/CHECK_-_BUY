'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LandListing } from '@/types';
import { toBanglaNumber, formatBdt, formatDate } from '@/lib/bangla-utils';
import {
  Building2,
  MapPin,
  Maximize2,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  User,
  Heart,
  Share2,
  Sparkles,
  ExternalLink,
  Layers,
  HelpCircle,
  Loader2,
  Tag,
  Check,
  Compass,
} from 'lucide-react';

export default function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<LandListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Interest Modal
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [interestPhone, setInterestPhone] = useState(user?.phone || '');
  const [interestMessage, setInterestMessage] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestFeedback, setInterestFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [interestSent, setInterestSent] = useState(false);

  // Copy share link
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/marketplace/listings/${id}`);
        const data = await res.json();
        if (data.success && data.listing) {
          setListing(data.listing);
        } else {
          setError(data.error || 'Property listing not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load property details.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();

    // Check saved state in localStorage
    try {
      const saved = localStorage.getItem('landcheck_favorites');
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids) && ids.includes(id)) {
          setIsSaved(true);
        }
      }
    } catch {}
  }, [id]);

  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem('landcheck_favorites');
      let ids: string[] = saved ? JSON.parse(saved) : [];
      if (isSaved) {
        ids = ids.filter((item) => item !== id);
        setIsSaved(false);
      } else {
        ids.push(id);
        setIsSaved(true);
      }
      localStorage.setItem('landcheck_favorites', JSON.stringify(ids));
    } catch {}
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleOpenInterestModal = () => {
    if (!user) {
      router.push(`/login?next=/buy-land/${id}&notice=auth_required`);
      return;
    }
    setInterestPhone(user.phone || '');
    setInterestMessage('');
    setInterestFeedback(null);
    setInterestModalOpen(true);
  };

  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInterest(true);
    setInterestFeedback(null);

    try {
      const res = await fetch(`/api/marketplace/listings/${id}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: interestPhone,
          message: interestMessage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setInterestFeedback({
          type: 'success',
          text: language === 'bn'
            ? 'আপনার আগ্রহ বিক্রেতার কাছে পাঠানো হয়েছে।'
            : 'Your inquiry has been successfully sent to the seller.',
        });
        setInterestSent(true);
        setTimeout(() => {
          setInterestModalOpen(false);
        }, 1800);
      } else {
        setInterestFeedback({
          type: 'error',
          text: data.error || 'Failed to submit interest.',
        });
      }
    } catch (err: any) {
      setInterestFeedback({
        type: 'error',
        text: err.message || 'Network error.',
      });
    } finally {
      setSubmittingInterest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] py-16">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
        <p className="text-slate-600 font-semibold text-sm">
          {language === 'bn' ? 'জমির বিবরণ লোড হচ্ছে...' : 'Loading property dossier...'}
        </p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'bn' ? 'বিজ্ঞাপনটি পাওয়া যায়নি' : 'Listing Inaccessible'}
          </h2>
          <p className="text-xs text-slate-600">{error || 'This listing may have been closed or unpublished.'}</p>
          <div className="pt-2">
            <Link
              href="/buy-land"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'bn' ? 'মার্কেটপ্লেসে ফিরে যান' : 'Back to Buy Land'}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOfficerVerified = listing.verificationStatus === 'Officer Verified';
  const isPreliminary = listing.verificationStatus === 'Preliminary Review';
  const allImages = listing.images && listing.images.length > 0
    ? listing.images
    : [{ id: 'main-img', listingId: listing.id, storagePath: listing.coverImage, isCover: true, createdAt: '' }];

  const activeImage = allImages[activeImageIndex] || allImages[0];

  // Price calculations
  const pricePerUnit = listing.areaValue > 0 ? (listing.priceBdt / listing.areaValue).toFixed(0) : 0;

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/buy-land"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'bn' ? 'সকল জমি বিজ্ঞাপন' : 'Back to All Listings'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied!') : (language === 'bn' ? 'শেয়ার' : 'Share')}</span>
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                isSaved
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
              <span>{isSaved ? (language === 'bn' ? 'সংরক্ষিত' : 'Saved') : (language === 'bn' ? 'সেভ করুন' : 'Save')}</span>
            </button>
          </div>
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-900 text-white">
                {listing.propertyType}
              </span>

              {/* Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                listing.status === 'Published'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : listing.status === 'Sold'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {listing.status}
              </span>

              {/* Verification Badge */}
              {isOfficerVerified ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'অফিসার যাচাইকৃত' : 'Officer Verified'}</span>
                </span>
              ) : isPreliminary ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'প্রাথমিক যাচাই' : 'Preliminary Review'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  <span>{language === 'bn' ? 'অভ্যন্তরীণ বিজ্ঞাপন' : 'Not Verified'}</span>
                </span>
              )}

              <span className="text-xs text-slate-400 font-mono">
                {listing.listingNumber}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {listing.title}
            </h1>

            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {listing.mouza}, {listing.upazila}, {listing.district}
              </span>
            </div>
          </div>

          {/* Price Box */}
          <div className="lg:text-right p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
              {language === 'bn' ? 'প্রস্তাবিত মোট মূল্য' : 'Asking Price (BDT)'}
            </div>
            <div className="text-3xl font-black text-emerald-950">
              {formatBdt(listing.priceBdt, language)}
            </div>
            <div className="text-xs text-emerald-800 font-medium">
              ≈ {formatBdt(pricePerUnit, language)} / {listing.areaUnit}
              {listing.isNegotiable && (
                <span className="ml-1 text-emerald-700 font-bold">
                  {language === 'bn' ? '(আলোচনা সাপেক্ষ)' : '(Negotiable)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Grid: Gallery & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Photo Gallery & Property Narrative */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery Card */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs p-4 space-y-4">
              {/* Main Feature Image */}
              <div className="relative h-80 sm:h-96 w-full rounded-2xl bg-slate-900 overflow-hidden">
                <img
                  src={activeImage.storagePath}
                  alt={activeImage.caption || listing.title}
                  className="w-full h-full object-cover"
                />
                {activeImage.caption && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl">
                    {activeImage.caption}
                  </div>
                )}
              </div>

              {/* Thumbnails list */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-emerald-600 scale-105 shadow-xs'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.storagePath} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Verification Status Explanation Card */}
            <div className={`p-6 rounded-3xl border ${
              isOfficerVerified
                ? 'bg-emerald-50/60 border-emerald-200'
                : isPreliminary
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-slate-100/70 border-slate-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  isOfficerVerified
                    ? 'bg-emerald-600 text-white'
                    : isPreliminary
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}>
                  {isOfficerVerified ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>
                      {isOfficerVerified
                        ? (language === 'bn' ? 'ভূমি কর্মকর্তা কর্তৃক যাচাইকৃত' : 'Officer Verified Status')
                        : isPreliminary
                        ? (language === 'bn' ? 'প্রাথমিক আইনি পর্যালোচনা সম্পন্ন' : 'Preliminary Due Diligence Review')
                        : (language === 'bn' ? 'সাধারণ বিক্রেতা বিজ্ঞাপন' : 'Standard Marketplace Listing')}
                    </span>
                  </h3>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {listing.verificationBadgeExplanation ||
                      (isOfficerVerified
                        ? 'This property has been vetted against official Land Registry records with verified Khatian/Dag lineage.'
                        : 'Preliminary checks completed. Prospective buyers are advised to order certified land documents through CHECK_&_BUY.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Property Description */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">
                {language === 'bn' ? 'জমির সম্পূর্ণ বিবরণ' : 'Property Description & Specifications'}
              </h2>
              <div className="prose text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>

              {/* Road & Utilities Section */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    {language === 'bn' ? 'রাস্তা সংযোগ' : 'Road Access'}
                  </h4>
                  <p className="text-slate-600">
                    {listing.roadAccess || (language === 'bn' ? 'সংযুক্ত পাকা রাস্তা' : 'Standard paved road access')}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">
                    {language === 'bn' ? 'নিকটবর্তী ল্যান্ডমার্ক' : 'Nearby Landmarks'}
                  </h4>
                  <p className="text-slate-600">
                    {listing.nearbyLandmarks || (language === 'bn' ? 'উল্লেখ নেই' : 'Not specified')}
                  </p>
                </div>
              </div>

              {/* Utilities Chips */}
              {listing.utilities && listing.utilities.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-bold text-slate-900 text-xs mb-2">
                    {language === 'bn' ? 'উপলব্ধ ইউটিলিটি সুবিধাসমূহ' : 'Available Utilities'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.utilities.map((util, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{util}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Land Registry Identifiers Card */}
            {(listing.khatianNo || listing.dagNo || listing.jlNumber) && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                      {language === 'bn' ? 'ভূমি জরিপ ও খতিয়ান পরিচিতি' : 'Land Survey Identifiers'}
                    </h3>
                  </div>

                  {/* Pre-check CTA */}
                  <Link
                    href={`/verify?district=${encodeURIComponent(listing.district)}&upazila=${encodeURIComponent(listing.upazila)}&mouza=${encodeURIComponent(listing.mouza)}&khatianNo=${encodeURIComponent(listing.khatianNo || '')}&dagNo=${encodeURIComponent(listing.dagNo || '')}`}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'ঝুঁকি স্ক্যানারে যাচাই করুন' : 'Verify in Risk Scanner'}</span>
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'bn' ? 'খতিয়ান নং' : 'Khatian No'}
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {listing.khatianNo || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'bn' ? 'দাগ নং' : 'Dag No'}
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {listing.dagNo || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      {language === 'bn' ? 'জে এল নং' : 'JL Number'}
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {listing.jlNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Seller Card & Buyer Actions */}
          <div className="space-y-6">
            {/* Express Interest Sticky CTA Box */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'bn' ? 'জমিতে সরাসরি যোগাযোগ করুন' : 'Contact Seller & Express Interest'}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                {language === 'bn'
                  ? 'এই জমিতে আগ্রহী হলে আপনার ফোন নম্বর ও বার্তা পাঠান। বিক্রেতা অবিলম্বে আপনার সাথে যোগাযোগ করবেন।'
                  : 'Submit your contact info to schedule physical land inspection and discuss terms directly.'}
              </p>

              {listing.status === 'Published' ? (
                <button
                  type="button"
                  onClick={handleOpenInterestModal}
                  disabled={interestSent}
                  className={`w-full py-3.5 px-4 rounded-2xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    interestSent
                      ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {interestSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'bn' ? 'আগ্রহ পাঠানো হয়েছে' : 'Interest Communicated'}</span>
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4" />
                      <span>{language === 'bn' ? 'আমি এই জমিতে আগ্রহী' : "I'm Interested in this Land"}</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold text-center">
                  {language === 'bn'
                    ? `এই বিজ্ঞাপনটি বর্তমানে ${listing.status} অবস্থায় রয়েছে`
                    : `This listing is currently ${listing.status}`}
                </div>
              )}

              {/* Due Diligence Notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1 text-emerald-900">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{language === 'bn' ? 'নিরাপদ বায়না পরামর্শ' : 'Due Diligence Tip'}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  {language === 'bn'
                    ? 'বায়না করার আগে CHECK_&_BUY-এর মাধ্যমে খতিয়ান ও রেকর্ড যাচাই করে নিন।'
                    : 'Always cross-examine survey chain continuity and verify certified mutation before handing over any advance payment.'}
                </p>
              </div>
            </div>

            {/* Seller Contact Card (Only permitted info) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                  {listing.sellerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {listing.sellerName}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {language === 'bn' ? 'যাচাইকৃত বিক্রেতা' : 'Registered Land Seller'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                {listing.sellerPhone ? (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">{listing.sellerPhone}</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-[11px]">
                    {language === 'bn' ? 'ফোন নম্বর গোপন রাখা হয়েছে' : 'Phone hidden by seller'}
                  </div>
                )}

                {listing.sellerEmail ? (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{listing.sellerEmail}</span>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 text-slate-500 pt-1 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {language === 'bn' ? 'বিজ্ঞাপন প্রকাশের তারিখ: ' : 'Listed: '}
                    {formatDate(listing.createdAt, language)}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Document Application CTA */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'bn' ? 'সরকারি দলিল আবেদন' : 'Need Official Certified Copy?'}</span>
              </div>
              <h4 className="font-bold text-white text-base">
                {language === 'bn' ? 'সরকারি খতিয়ান বা পর্চা আবেদন' : 'Apply for Official Land Document'}
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                {language === 'bn'
                  ? 'এই জমির সরকারি সার্টিফাইড খতিয়ান বা নামজারি পরচা পেতে সহকারী কমিশনার (ভূমি) অফিসে আবেদন করুন।'
                  : 'Apply for official AC Land certified khatian copy through our integrated application system.'}
              </p>
              <Link
                href={`/apply?district=${encodeURIComponent(listing.district)}&upazila=${encodeURIComponent(listing.upazila)}&mouza=${encodeURIComponent(listing.mouza)}&khatianNo=${encodeURIComponent(listing.khatianNo || '')}&dagNo=${encodeURIComponent(listing.dagNo || '')}`}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>{language === 'bn' ? 'দলিলের জন্য আবেদন করুন' : 'Apply for Official Copy'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Express Interest Modal */}
      {interestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {language === 'bn' ? 'জমিতে আগ্রহ প্রকাশ করুন' : 'Express Interest'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {listing.listingNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInterestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitInterest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'আপনার যোগাযোগ মোবাইল নম্বর' : 'Your Contact Phone'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={interestPhone}
                    onChange={(e) => setInterestPhone(e.target.value)}
                    placeholder="01712-XXXXXX"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বার্তা বা জিজ্ঞাসা (ঐচ্ছিক)' : 'Message / Inquiries'}
                </label>
                <textarea
                  rows={3}
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'আমি জমিটি সরাসরি দেখতে চাই এবং দলিল যাচাই করতে আগ্রহী...'
                      : 'I would like to arrange an on-site visit and inspect title records...'
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {interestFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    interestFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {interestFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{interestFeedback.text}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInterestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingInterest}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {submittingInterest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'bn' ? 'আগ্রহ পাঠান' : 'Send Interest'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
