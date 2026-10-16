'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LandListing, LandListingInterest, ListingStatus } from '@/types';
import { formatBdt, formatDate, toBanglaNumber } from '@/lib/bangla-utils';
import {
  Tag,
  PlusCircle,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Edit3,
  Phone,
  Mail,
  Users,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export default function MyListingsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [listings, setListings] = useState<LandListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter tab
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');

  // Selected Listing for Viewing Inquiries
  const [selectedListingForInquiries, setSelectedListingForInquiries] = useState<LandListing | null>(null);
  const [inquiries, setInquiries] = useState<LandListingInterest[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Action feedback
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Status change modal (Mark as Sold / Closed / Resubmit)
  const [editingListing, setEditingListing] = useState<LandListing | null>(null);
  const [editPriceBdt, setEditPriceBdt] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMyListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/marketplace/listings?myListings=true');
      const data = await res.json();
      if (data.success) {
        setListings(data.listings || []);
      } else {
        setError(data.error || 'Failed to load your listings.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleOpenInquiries = async (listing: LandListing) => {
    setSelectedListingForInquiries(listing);
    setLoadingInquiries(true);
    try {
      const res = await fetch(`/api/marketplace/interests?role=seller&listingId=${listing.id}`);
      const data = await res.json();
      if (data.success) {
        setInquiries(data.interests || []);
      } else {
        setInquiries([]);
      }
    } catch {
      setInquiries([]);
    } finally {
      setLoadingInquiries(false);
    }
  };

  const handleUpdateStatus = async (listingId: string, newStatus: 'Sold' | 'Closed' | 'Pending Review') => {
    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({
          type: 'success',
          text: language === 'bn'
            ? `বিজ্ঞাপন স্ট্যাটাস ${newStatus}-এ পরিবর্তিত হয়েছে।`
            : `Listing status updated to ${newStatus}.`,
        });
        fetchMyListings();
        setTimeout(() => setActionMsg(null), 3000);
      } else {
        setActionMsg({ type: 'error', text: data.error || 'Failed to update status.' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleOpenEditModal = (listing: LandListing) => {
    setEditingListing(listing);
    setEditPriceBdt(listing.priceBdt.toString());
    setEditDescription(listing.description);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/marketplace/listings/${editingListing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceBdt: parseFloat(editPriceBdt),
          description: editDescription,
          status: editingListing.status === 'Correction Required' ? 'Pending Review' : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMsg({
          type: 'success',
          text: language === 'bn' ? 'বিজ্ঞাপন সফলভাবে আপডেট হয়েছে।' : 'Listing updated successfully.',
        });
        setEditingListing(null);
        fetchMyListings();
        setTimeout(() => setActionMsg(null), 3000);
      } else {
        setActionMsg({ type: 'error', text: data.error || 'Update failed.' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredListings = statusFilter === 'all'
    ? listings
    : listings.filter((l) => l.status === statusFilter);

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'বিক্রেতা ড্যাশবোর্ড' : 'Seller Dashboard'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {language === 'bn' ? 'আমার জমির বিজ্ঞাপনসমূহ' : 'My Land Listings'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {language === 'bn'
                ? 'আপনার প্রকাশিত, পর্যালোচনধীন এবং বিক্রিত জমির বিজ্ঞাপন ও ক্রেতা আগ্রহ পরিচালনা করুন।'
                : 'Manage your property listings, moderation comments, buyer inquiries, and sales status.'}
            </p>
          </div>

          <Link
            href="/sell-land"
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 self-start"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন বিজ্ঞাপন দিন' : 'Post New Listing'}</span>
          </Link>
        </div>

        {/* Action Alert Banner */}
        {actionMsg && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              actionMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {actionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionMsg.text}</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: language === 'bn' ? 'সকল বিজ্ঞাপন' : 'All Listings' },
            { id: 'Published', label: language === 'bn' ? 'প্রকাশিত' : 'Published' },
            { id: 'Pending Review', label: language === 'bn' ? 'পর্যালোচনাধীন' : 'Pending Review' },
            { id: 'Correction Required', label: language === 'bn' ? 'সংশোধন আবশ্যক' : 'Correction Required' },
            { id: 'Sold', label: language === 'bn' ? 'বিক্রিত' : 'Sold' },
            { id: 'Closed', label: language === 'bn' ? 'বন্ধ' : 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Listings List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">
              {language === 'bn' ? 'বিজ্ঞাপন লোড হচ্ছে...' : 'Loading listings...'}
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-bold text-rose-900 text-base">{error}</h3>
            <button
              onClick={fetchMyListings}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'bn' ? 'কোনো বিজ্ঞাপন পাওয়া যায়নি' : 'No Listings in this Category'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'bn'
                ? 'আপনার কোনো সম্পত্তি বিক্রয়ের জন্য যুক্ত করতে "নতুন বিজ্ঞাপন দিন"-এ ক্লিক করুন।'
                : 'Click "Post New Listing" to publish land for sale on CHECK_&_BUY.'}
            </p>
            <Link
              href="/sell-land"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'bn' ? 'জমি পোস্ট করুন' : 'Post Land'}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((item) => {
              const isPublished = item.status === 'Published';
              const isPending = item.status === 'Pending Review' || item.status === 'Under Review';
              const isCorrection = item.status === 'Correction Required';
              const isSold = item.status === 'Sold';
              const isClosed = item.status === 'Closed';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Left: Thumbnail & Main Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <img
                      src={item.coverImage || '/images/properties/residential-plot.svg'}
                      alt={item.title}
                      className="w-full sm:w-28 h-24 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {item.listingNumber}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isCorrection
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isSold
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {item.status}
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDate(item.createdAt, language)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {item.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="font-extrabold text-emerald-800">
                          {formatBdt(item.priceBdt, language)}
                        </span>
                        <span>•</span>
                        <span>
                          {item.areaValue} {item.areaUnit} ({item.propertyType})
                        </span>
                        <span>•</span>
                        <span>
                          {item.mouza}, {item.upazila}
                        </span>
                      </div>

                      {/* Moderation instructions banner if correction or rejection */}
                      {(item.correctionInstructions || item.reviewReason) && isCorrection && (
                        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              {language === 'bn' ? 'সংশোধনের নির্দেশ:' : 'Correction Requested:'}
                            </span>{' '}
                            <span>{item.correctionInstructions || item.reviewReason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap md:flex-col items-stretch justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/buy-land/${item.id}`}
                        className="flex-1 md:flex-none px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'bn' ? 'প্রিভিউ' : 'Preview'}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleOpenInquiries(item)}
                        className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'bn' ? 'ক্রেতা অনুসন্ধান' : 'Inquiries'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>

                      {/* Status Toggle Actions */}
                      {isPublished && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'Sold')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold border border-indigo-200 cursor-pointer"
                        >
                          {language === 'bn' ? 'বিক্রিত চিহ্নিত করুন' : 'Mark Sold'}
                        </button>
                      )}

                      {isCorrection && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'Pending Review')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          {language === 'bn' ? 'পুনরায় জমা দিন' : 'Resubmit for Review'}
                        </button>
                      )}

                      {!isClosed && !isSold && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, 'Closed')}
                          className="px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-500 text-xs font-medium cursor-pointer"
                        >
                          {language === 'bn' ? 'বিজ্ঞাপন বন্ধ' : 'Close'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inquiries Modal */}
      {selectedListingForInquiries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {language === 'bn' ? 'আগ্রহী ক্রেতা তালিকা' : 'Interested Buyer Inquiries'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {selectedListingForInquiries.title} ({selectedListingForInquiries.listingNumber})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListingForInquiries(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inquiries List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingInquiries ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading buyer inquiries...
                </div>
              ) : inquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">
                    {language === 'bn' ? 'এখনো কোনো ক্রেতা আগ্রহ জানাননি' : 'No buyer inquiries received yet.'}
                  </p>
                  <p className="text-slate-400">
                    {language === 'bn'
                      ? 'বিজ্ঞাপনটি লাইভ থাকলে ক্রেতারা "আমি আগ্রহী" বাটনে ক্লিক করে যোগাযোগ করবেন।'
                      : 'When buyers click "I\'m Interested", their contact details will appear here.'}
                  </p>
                </div>
              ) : (
                inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {inq.buyerName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(inq.createdAt, language)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-700">
                      <a
                        href={`tel:${inq.buyerPhone}`}
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{inq.buyerPhone}</span>
                      </a>
                      <a
                        href={`mailto:${inq.buyerEmail}`}
                        className="inline-flex items-center gap-1 text-slate-600 hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inq.buyerEmail}</span>
                      </a>
                    </div>

                    {inq.message && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-700 italic">
                        "{inq.message}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedListingForInquiries(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'bn' ? 'বিজ্ঞাপন সংশোধন' : 'Edit Listing'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'মূল্য (BDT)' : 'Price in BDT'}
                </label>
                <input
                  type="number"
                  required
                  value={editPriceBdt}
                  onChange={(e) => setEditPriceBdt(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বিবরণ' : 'Description'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {editingListing.status === 'Published' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  {language === 'bn'
                    ? 'সতর্কতা: প্রকাশিত বিজ্ঞাপনের মূল্য বা মূল বিবরণ পরিবর্তন করলে তা পুনঃনিরীক্ষণের জন্য "Pending Review"-এ চলে যাবে।'
                    : 'Notice: Modifying price or description of a published listing will return it to "Pending Review" for moderation.'}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 disabled:opacity-60"
                >
                  {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
