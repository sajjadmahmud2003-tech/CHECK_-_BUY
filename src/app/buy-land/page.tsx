'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LandListing, ListingPropertyType } from '@/types';
import { toBanglaNumber, formatBdt } from '@/lib/bangla-utils';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Maximize2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  RotateCcw,
  Tag,
  CheckCircle2,
  X,
  Loader2,
  Sparkles,
  Phone,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

function BuyLandContent() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || 'all');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || 'all');
  const [verificationStatus, setVerificationStatus] = useState(searchParams.get('verificationStatus') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'area_desc'>(
    (searchParams.get('sortBy') as any) || 'newest'
  );

  // Data States
  const [listings, setListings] = useState<LandListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Interest Modal State
  const [selectedListingForInterest, setSelectedListingForInterest] = useState<LandListing | null>(null);
  const [interestPhone, setInterestPhone] = useState(user?.phone || '');
  const [interestMessage, setInterestMessage] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestFeedback, setInterestFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expressedInterestIds, setExpressedInterestIds] = useState<string[]>([]);

  // Mobile filters open
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch listings
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (district !== 'all') params.set('district', district);
      if (propertyType !== 'all') params.set('propertyType', propertyType);
      if (verificationStatus !== 'all') params.set('verificationStatus', verificationStatus);
      if (minPrice && parseFloat(minPrice) > 0) params.set('minPrice', minPrice);
      if (maxPrice && parseFloat(maxPrice) > 0) params.set('maxPrice', maxPrice);
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/marketplace/listings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setListings(data.listings || []);
        setTotalCount(data.total || 0);
      } else {
        setError(data.error || 'Failed to load land listings.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching marketplace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [district, propertyType, verificationStatus, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleClearFilters = () => {
    setQuery('');
    setDistrict('all');
    setPropertyType('all');
    setVerificationStatus('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    router.replace('/buy-land');
  };

  const handleOpenInterestModal = (listing: LandListing) => {
    if (!user) {
      router.push(`/login?next=/buy-land/${listing.id}&notice=auth_required`);
      return;
    }
    setSelectedListingForInterest(listing);
    setInterestPhone(user.phone || '');
    setInterestMessage('');
    setInterestFeedback(null);
  };

  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForInterest) return;

    setSubmittingInterest(true);
    setInterestFeedback(null);

    try {
      const res = await fetch(`/api/marketplace/listings/${selectedListingForInterest.id}/interest`, {
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
            ? 'আপনার আগ্রহ সফলভাবে বিক্রেতার কাছে পাঠানো হয়েছে।'
            : 'Your interest has been communicated to the seller successfully.',
        });
        setExpressedInterestIds((prev) => [...prev, selectedListingForInterest.id]);
        setTimeout(() => {
          setSelectedListingForInterest(null);
        }, 1800);
      } else {
        setInterestFeedback({
          type: 'error',
          text: data.error || 'Failed to express interest.',
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

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* Marketplace Header Banner */}
      <section className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {language === 'bn'
                  ? 'স্মার্ট ভূমি মার্কেটপ্লেস • যাচাইকৃত জমি ক্রয়-বিক্রয়'
                  : 'Smart Land Marketplace • Verified Land & Property Portal'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {language === 'bn' ? 'নিরাপদে জমি ক্রয় করুন' : 'Browse & Buy Verified Land in Bangladesh'}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {language === 'bn'
                ? 'অনুমোদিত ও নিয়মিত জমি তালিকা অনুসন্ধান করুন। সিএস, এসএ, আরএস জরিপ খতিয়ান এবং ঝুঁকি স্ক্রিনিং রিপোর্ট সহ সরাসরি বিক্রেতার সাথে যোগাযোগ করুন।'
                : 'Explore curated land listings with transparent CS, SA, RS record histories, preliminary legal screening, and direct seller inquiry.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/sell-land"
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? 'আপনার জমি পোস্ট করুন' : 'Post Your Land'}</span>
            </Link>
            {user && (
              <Link
                href="/my-interests"
                className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-all flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>{language === 'bn' ? 'আমার আগ্রহী জমি' : 'My Interests'}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Search & Quick Controls Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'মৌজা, দাগ নং, এলাকা বা শিরোনাম দিয়ে খুঁজুন...'
                    : 'Search by mouza, dag number, area, or keywords...'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="submit"
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{language === 'bn' ? 'অনুসন্ধান' : 'Search'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold flex items-center gap-1.5"
              >
                <Filter className="w-4 h-4 text-slate-500" />
                <span>{language === 'bn' ? 'ফিল্টার' : 'Filters'}</span>
              </button>
            </div>
          </form>

          {/* Desktop Filter Row */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* District */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'জেলা' : 'District'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">{language === 'bn' ? 'সকল জেলা' : 'All Districts'}</option>
                <option value="Dhaka">Dhaka (ঢাকা)</option>
                <option value="Gazipur">Gazipur (গাজীপুর)</option>
                <option value="Narayanganj">Narayanganj (নারায়ণগঞ্জ)</option>
                <option value="Chattogram">Chattogram (চট্টগ্রাম)</option>
                <option value="Sylhet">Sylhet (সিলেট)</option>
                <option value="Rajshahi">Rajshahi (রাজশাহী)</option>
                <option value="Rangpur">Rangpur (রংপুর)</option>
                <option value="Khulna">Khulna (খুলনা)</option>
              </select>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'জমির ধরন' : 'Property Type'}
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">{language === 'bn' ? 'সকল ধরন' : 'All Types'}</option>
                <option value="Residential">{language === 'bn' ? 'আবাসিক' : 'Residential'}</option>
                <option value="Commercial">{language === 'bn' ? 'বাণিজ্যিক' : 'Commercial'}</option>
                <option value="Agricultural">{language === 'bn' ? 'কৃষি জমি' : 'Agricultural'}</option>
                <option value="Industrial">{language === 'bn' ? 'শিল্প কারখানা' : 'Industrial'}</option>
                <option value="Other">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'যাচাইয়ের অবস্থা' : 'Verification Status'}
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">{language === 'bn' ? 'সকল অবস্থা' : 'All Status'}</option>
                <option value="Officer Verified">{language === 'bn' ? 'অফিসার যাচাইকৃত' : 'Officer Verified'}</option>
                <option value="Preliminary Review">{language === 'bn' ? 'প্রাথমিক পর্যালোচনা' : 'Preliminary Review'}</option>
                <option value="Not Verified">{language === 'bn' ? 'অযাচাইকৃত' : 'Not Verified'}</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'সর্বনিম্ন মূল্য (৳)' : 'Min Price (BDT)'}
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'সর্বোচ্চ মূল্য (৳)' : 'Max Price (BDT)'}
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="50,000,000"
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {language === 'bn' ? 'সাজান' : 'Sort By'}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="newest">{language === 'bn' ? 'সর্বশেষ প্রকাশিত' : 'Newest First'}</option>
                <option value="price_asc">{language === 'bn' ? 'মূল্য: কম থেকে বেশি' : 'Price: Low to High'}</option>
                <option value="price_desc">{language === 'bn' ? 'মূল্য: বেশি থেকে কম' : 'Price: High to Low'}</option>
                <option value="area_desc">{language === 'bn' ? 'বৃহত্তম জমির পরিমাণ' : 'Largest Area'}</option>
              </select>
            </div>
          </div>

          {/* Active Filter Clear CTA */}
          {(district !== 'all' || propertyType !== 'all' || verificationStatus !== 'all' || minPrice || maxPrice || query) && (
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                {language === 'bn'
                  ? `মোট প্রাপ্ত ফলাফল: ${toBanglaNumber(totalCount)}টি`
                  : `Total matching listings: ${totalCount}`}
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'ফিল্টার মুছুন' : 'Clear Filters'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Listings Display Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-48 bg-slate-200 w-full" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                  <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="font-bold text-rose-900 text-lg">
              {language === 'bn' ? 'তথ্য লোড করতে সমস্যা হয়েছে' : 'Failed to Load Listings'}
            </h3>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={fetchListings}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
            >
              {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-xl">
              {language === 'bn' ? 'কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No Land Listings Found'}
            </h3>
            <p className="text-slate-500 text-sm">
              {language === 'bn'
                ? 'আপনার বাছাই করা ফিল্টারের সাথে মিলে এমন কোনো প্রকাশিত জমি বর্তমানে উপলব্ধ নেই।'
                : 'No published listings match your current filters. Try relaxing search criteria.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                {language === 'bn' ? 'সকল ফিল্টার রিসেট' : 'Reset All Filters'}
              </button>
              <Link
                href="/sell-land"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {language === 'bn' ? 'নতুন জমি পোস্ট করুন' : 'Post Your Land'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => {
              const isOfficerVerified = item.verificationStatus === 'Officer Verified';
              const isPreliminary = item.verificationStatus === 'Preliminary Review';
              const isInterestExpressed = expressedInterestIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Cover Photo */}
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={item.coverImage || '/images/properties/residential-plot.svg'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Property Type Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                        {item.propertyType}
                      </span>

                      {/* Verification Status Badge */}
                      <div className="absolute top-3 right-3">
                        {isOfficerVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                            <ShieldCheck className="w-3 h-3" />
                            <span>{language === 'bn' ? 'অফিসার যাচাইকৃত' : 'Officer Verified'}</span>
                          </span>
                        ) : isPreliminary ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                            <ShieldAlert className="w-3 h-3" />
                            <span>{language === 'bn' ? 'প্রাথমিক যাচাই' : 'Preliminary Review'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-700/80 text-slate-200">
                            <span>{language === 'bn' ? 'অভ্যন্তরীণ বিজ্ঞাপন' : 'Not Verified'}</span>
                          </span>
                        )}
                      </div>

                      {/* Demo Notice chip if applicable */}
                      {item.isDemoData && (
                        <span className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
                          Demo Sample
                        </span>
                      )}

                      {/* Price on Image Banner */}
                      <div className="absolute bottom-2.5 right-3 text-right">
                        <div className="text-lg font-black text-white drop-shadow-md">
                          {formatBdt(item.priceBdt, language)}
                        </div>
                        {item.isNegotiable && (
                          <span className="text-[10px] text-emerald-300 font-semibold drop-shadow-xs">
                            {language === 'bn' ? '(আলোচনা সাপেক্ষ)' : '(Negotiable)'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-3">
                      {/* Location & Title */}
                      <div>
                        <div className="flex items-center gap-1 text-slate-500 text-xs mb-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {item.mouza}, {item.upazila}, {item.district}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                          {item.title}
                        </h3>
                      </div>

                      {/* Land Metrics Bar */}
                      <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                            {language === 'bn' ? 'জমির পরিমাণ' : 'Land Area'}
                          </span>
                          <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                            {language === 'bn' ? toBanglaNumber(item.areaValue) : item.areaValue} {item.areaUnit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                            {language === 'bn' ? 'রাস্তা সংযোগ' : 'Road Access'}
                          </span>
                          <span className="font-semibold text-slate-700 text-xs truncate block" title={item.roadAccess || 'Paved Road'}>
                            {item.roadAccess || (language === 'bn' ? 'সংযুক্ত পাকা রাস্তা' : 'Standard Paved')}
                          </span>
                        </div>
                      </div>

                      {/* Description Snippet */}
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/buy-land/${item.id}`}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                    >
                      <span>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenInterestModal(item)}
                      disabled={isInterestExpressed}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                        isInterestExpressed
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {isInterestExpressed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'bn' ? 'আগ্রহ পাঠানো হয়েছে' : 'Interest Sent'}</span>
                        </>
                      ) : (
                        <span>{language === 'bn' ? 'আমি আগ্রহী' : "I'm Interested"}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Interest Modal */}
      {selectedListingForInterest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {language === 'bn' ? 'জমিতে আগ্রহ প্রকাশ করুন' : 'Express Buyer Interest'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {selectedListingForInterest.listingNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListingForInterest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Property Summary Pill */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-900 text-xs line-clamp-1">
                {selectedListingForInterest.title}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  {selectedListingForInterest.areaValue} {selectedListingForInterest.areaUnit}
                </span>
                <span className="font-extrabold text-emerald-700">
                  {formatBdt(selectedListingForInterest.priceBdt, language)}
                </span>
              </div>
            </div>

            {/* Interest Form */}
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
                  {language === 'bn' ? 'বিক্রেতার কাছে বার্তা (ঐচ্ছিক)' : 'Message to Seller (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'জমি পরিদর্শন বা বিস্তারিত আলোচনার আগ্রহ জানাচ্ছি...'
                      : 'I am interested in scheduling a physical site inspection or asking about deed...'
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
                  onClick={() => setSelectedListingForInterest(null)}
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
                  <span>{language === 'bn' ? 'আগ্রহ নিশ্চিত করুন' : 'Confirm Interest'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuyLandPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <BuyLandContent />
    </Suspense>
  );
}
