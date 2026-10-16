'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LandListing, LandListingInterest } from '@/types';
import { formatBdt, formatDate } from '@/lib/bangla-utils';
import {
  Heart,
  Building2,
  MapPin,
  Calendar,
  ArrowRight,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface InterestItem {
  interest: LandListingInterest;
  listing: LandListing;
}

export default function MyInterestsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [interests, setInterests] = useState<InterestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const fetchMyInterests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/marketplace/interests');
      const data = await res.json();
      if (data.success) {
        setInterests(data.interests || []);
      } else {
        setError(data.error || 'Failed to load your interests.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyInterests();
  }, []);

  const handleWithdraw = async (listingId: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি এই জমি থেকে আপনার আগ্রহ প্রত্যাহার করতে চান?' : 'Are you sure you want to withdraw your interest in this property?')) {
      return;
    }

    setWithdrawingId(listingId);
    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'withdraw' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({
          type: 'success',
          text: language === 'bn' ? 'আগ্রহ প্রত্যাহার সফল হয়েছে।' : 'Interest successfully withdrawn.',
        });
        fetchMyInterests();
        setTimeout(() => setActionMsg(null), 3000);
      } else {
        setActionMsg({ type: 'error', text: data.error || 'Failed to withdraw interest.' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{language === 'bn' ? 'ক্রেতা পোর্টাল' : 'Buyer Portfolio'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {language === 'bn' ? 'আমার আগ্রহী জমির তালিকা' : 'My Saved Property Inquiries'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {language === 'bn'
                ? 'যেসব জমিতে আপনি বিক্রেতার সাথে যোগাযোগের আগ্রহ জানিয়েছেন তাদের বর্তমান অবস্থা ও বিবরণ।'
                : 'Track the status and seller contact of properties you have expressed interest in.'}
            </p>
          </div>

          <Link
            href="/buy-land"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 self-start"
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'bn' ? 'আরও জমি খুঁজুন' : 'Browse More Land'}</span>
          </Link>
        </div>

        {/* Action Message Banner */}
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

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">
              {language === 'bn' ? 'তথ্য লোড হচ্ছে...' : 'Loading saved interests...'}
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
            <h3 className="font-bold text-rose-900 text-base">{error}</h3>
            <button
              onClick={fetchMyInterests}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        ) : interests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              {language === 'bn' ? 'কোনো আগ্রহী জমি সংরক্ষিত নেই' : 'No Property Interests Yet'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'bn'
                ? 'মার্কেটপ্লেসে জমি দেখে "আমি আগ্রহী" বাটনে ক্লিক করলে তা এখানে সংরক্ষিত হবে।'
                : 'Explore listings in the Buy Land marketplace and click "I\'m Interested" to connect with verified sellers.'}
            </p>
            <Link
              href="/buy-land"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs"
            >
              <span>{language === 'bn' ? 'জমি ব্রাউজ করুন' : 'Browse Buy Land'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {interests.map(({ interest, listing }) => {
              const isActive = interest.status === 'Active';
              const isWithdrawn = interest.status === 'Withdrawn';
              const isListingSold = listing.status === 'Sold';
              const isListingClosed = listing.status === 'Closed';

              return (
                <div
                  key={interest.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <img
                      src={listing.coverImage || '/images/properties/residential-plot.svg'}
                      alt={listing.title}
                      className="w-24 h-24 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Listing Status */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            listing.status === 'Published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isListingSold
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {listing.status}
                        </span>

                        {/* Interest Status */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isActive
                            ? language === 'bn' ? 'সক্রিয় আগ্রহ' : 'Active Interest'
                            : language === 'bn' ? 'প্রত্যাহারকৃত' : 'Withdrawn'}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          {formatDate(interest.createdAt, language)}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base truncate">
                        {listing.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="font-extrabold text-emerald-800">
                          {formatBdt(listing.priceBdt, language)}
                        </span>
                        <span>•</span>
                        <span>
                          {listing.areaValue} {listing.areaUnit} ({listing.propertyType})
                        </span>
                        <span>•</span>
                        <span>
                          {listing.mouza}, {listing.district}
                        </span>
                      </div>

                      {interest.message && (
                        <p className="text-[11px] text-slate-500 italic truncate max-w-md">
                          "{interest.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <Link
                      href={`/buy-land/${listing.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 shadow-xs"
                    >
                      <span>{language === 'bn' ? 'বিস্তারিত' : 'View'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {isActive && !isListingSold && !isListingClosed && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(listing.id)}
                        disabled={withdrawingId === listing.id}
                        className="px-3.5 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1 border border-transparent hover:border-rose-200 cursor-pointer disabled:opacity-60"
                        title="Withdraw interest"
                      >
                        {withdrawingId === listing.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>{language === 'bn' ? 'প্রত্যাহার' : 'Withdraw'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
