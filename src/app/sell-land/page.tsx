'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ListingPropertyType, ListingAreaUnit } from '@/types';
import { BANGLADESH_DISTRICTS } from '@/lib/bangla-utils';
import {
  Building2,
  PlusCircle,
  MapPin,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  FileText,
  Lock,
  Eye,
  Info,
  ArrowRight,
  ArrowLeft,
  Phone,
  Sparkles,
} from 'lucide-react';

interface UploadedImageItem {
  id: string;
  storagePath: string;
  isCover: boolean;
  caption: string;
  fileName: string;
}

interface UploadedDocItem {
  id: string;
  fileName: string;
  storageKey: string;
  fileType: string;
  fileSize: number;
}

export default function SellLandPage() {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Basic Information
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<ListingPropertyType>('Residential');
  const [priceBdt, setPriceBdt] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState<ListingAreaUnit>('Katha');

  // Location
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('');
  const [mouza, setMouza] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Property Details
  const [description, setDescription] = useState('');
  const [roadAccess, setRoadAccess] = useState('');
  const [nearbyLandmarks, setNearbyLandmarks] = useState('');
  const [khatianNo, setKhatianNo] = useState('');
  const [dagNo, setDagNo] = useState('');
  const [jlNumber, setJlNumber] = useState('');

  // Utilities
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([
    'Electricity',
    'Water Supply',
  ]);

  // Images
  const [images, setImages] = useState<UploadedImageItem[]>([
    {
      id: 'default-cover',
      storagePath: '/images/properties/residential-plot.svg',
      isCover: true,
      caption: 'Front boundary demarcation photo',
      fileName: 'demarcation_preview.svg',
    },
  ]);

  // Private Supporting Documents
  const [documents, setDocuments] = useState<UploadedDocItem[]>([]);

  // Seller Contact
  const [sellerPhone, setSellerPhone] = useState(user?.phone || '01712-345678');
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(false);

  // Submission & Confirmation States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ id: string; listingNumber: string } | null>(null);

  const utilityOptions = [
    'Electricity',
    'Electricity (3-phase)',
    'Water Supply',
    'Deep Tube-well',
    'Titas Gas Pipeline',
    'Planned Drainage',
    'Paved Approach Road',
  ];

  const handleToggleUtility = (util: string) => {
    setSelectedUtilities((prev) =>
      prev.includes(util) ? prev.filter((u) => u !== util) : [...prev, util]
    );
  };

  // Image Upload Handler (simulated with instant client-side preview & SVG fallbacks)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files (JPEG, PNG, WEBP, SVG) are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Each image must be smaller than 5 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        const newImg: UploadedImageItem = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          storagePath: resultUrl,
          isCover: images.length === 0,
          caption: file.name,
          fileName: file.name,
        };
        setImages((prev) => [...prev, newImg]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSetCover = (imgId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === imgId,
      }))
    );
  };

  const handleRemoveImage = (imgId: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== imgId);
      if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  // Document Upload Handler (Private storage)
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Supporting documents must be smaller than 10 MB.');
        return;
      }
      const newDoc: UploadedDocItem = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fileName: file.name,
        storageKey: `private_listing_docs/${file.name}`,
        fileType: file.type || 'application/pdf',
        fileSize: file.size,
      };
      setDocuments((prev) => [...prev, newDoc]);
    });
  };

  const handleRemoveDoc = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Pre-validate before confirmation modal
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title || title.trim().length < 5) {
      setErrorMsg('Property title must be at least 5 characters long.');
      return;
    }
    const numPrice = parseFloat(priceBdt);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Please enter a valid asking price in BDT.');
      return;
    }
    const numArea = parseFloat(areaValue);
    if (isNaN(numArea) || numArea <= 0) {
      setErrorMsg('Please specify a valid land area.');
      return;
    }
    if (!upazila.trim() || !mouza.trim()) {
      setErrorMsg('Upazila and Mouza are mandatory location fields.');
      return;
    }
    if (!locationDescription.trim()) {
      setErrorMsg('Please provide a full location description or address.');
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setErrorMsg('Description must be at least 15 characters.');
      return;
    }
    if (!sellerPhone.trim()) {
      setErrorMsg('Seller contact phone number is required.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Submit to Backend API
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: title.trim(),
        propertyType,
        priceBdt: parseFloat(priceBdt),
        isNegotiable,
        areaValue: parseFloat(areaValue),
        areaUnit,
        district,
        upazila: upazila.trim(),
        mouza: mouza.trim(),
        locationDescription: locationDescription.trim(),
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        description: description.trim(),
        roadAccess: roadAccess.trim() || undefined,
        utilities: selectedUtilities,
        nearbyLandmarks: nearbyLandmarks.trim() || undefined,
        khatianNo: khatianNo.trim() || undefined,
        dagNo: dagNo.trim() || undefined,
        jlNumber: jlNumber.trim() || undefined,
        sellerPhone: sellerPhone.trim(),
        showPhone,
        showEmail,
        images: images.map((img) => ({
          storagePath: img.storagePath,
          isCover: img.isCover,
          caption: img.caption,
        })),
        documents: documents.map((doc) => ({
          fileName: doc.fileName,
          storageKey: doc.storageKey,
          fileType: doc.fileType,
          fileSize: doc.fileSize,
        })),
      };

      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.listing) {
        setShowConfirmModal(false);
        setSuccessResult({
          id: data.listing.id,
          listingNumber: data.listing.listingNumber,
        });
      } else {
        setShowConfirmModal(false);
        setErrorMsg(data.error || 'Failed to submit listing.');
      }
    } catch (err: any) {
      setShowConfirmModal(false);
      setErrorMsg(err.message || 'Network error while submitting listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="flex-1 bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              {successResult.listingNumber}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {language === 'bn' ? 'বিজ্ঞাপন সফলভাবে জমা হয়েছে!' : 'Listing Submitted Successfully!'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {language === 'bn'
                ? 'আপনার জমির বিজ্ঞাপনটি জমা নেওয়া হয়েছে এবং প্রাথমিক পর্যালোচনার (Pending Review) অপেক্ষায় রয়েছে। অনুমোদনের পর এটি মার্কেটপ্লেসে লাইভ প্রদর্শিত হবে।'
                : 'Your land listing has been registered with status "Pending Review". Once verified by our moderation team, it will appear publicly on the Buy Land marketplace.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 text-slate-700">
            <div className="font-bold text-slate-900">
              {language === 'bn' ? 'পরবর্তী ধাপসমূহ:' : 'What happens next?'}
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>{language === 'bn' ? 'মডারেটর আপনার খতিয়ান ও রেকর্ড চেক করবেন।' : 'Moderators cross-check land identifiers.'}</li>
              <li>{language === 'bn' ? 'স্ট্যাটাস পরিবর্তন হলে ইন-অ্যাপ নোটিফিকেশন পাবেন।' : 'You will receive an in-app notification when status updates.'}</li>
              <li>{language === 'bn' ? 'ক্রেতারা আগ্রহ পাঠালে সরাসরি দেখতে পারবেন।' : 'Manage interested buyer inquiries in "My Listings".'}</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/my-listings"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
            >
              {language === 'bn' ? 'আমার বিজ্ঞাপনসমূহ দেখুন' : 'Go to My Listings'}
            </Link>
            <Link
              href="/buy-land"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs"
            >
              {language === 'bn' ? 'মার্কেটপ্লেস দেখুন' : 'Browse Buy Land'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'জমি বিক্রয় প্ল্যাটফর্ম' : 'Land Sellers Portal'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {language === 'bn' ? 'আপনার জমি বিক্রয়ের বিজ্ঞাপন দিন' : 'Post Your Land for Sale'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              {language === 'bn'
                ? 'সঠিক তথ্য ও খতিয়ান দিয়ে বিজ্ঞাপন দিন। বিজ্ঞাপনটি অনুমোদনের পর লক্ষাধিক সম্ভাব্য ক্রেতার কাছে পৌঁছে যাবে।'
                : 'Publish your land listing with verified boundaries, road access, and survey records.'}
            </p>
          </div>

          <Link
            href="/my-listings"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs self-start"
          >
            {language === 'bn' ? 'আমার বিদ্যমান বিজ্ঞাপন' : 'My Existing Listings'}
          </Link>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handlePreSubmit} className="space-y-8">
          {/* Section 1: Basic Property Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'bn' ? '১. প্রাথমিক সম্পত্তির তথ্য' : '1. Basic Property Information'}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বিজ্ঞাপনের শিরোনাম *' : 'Property Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'যেমন: পূর্বাচল সেক্টর ২১-এ ৫ কাঠা দক্ষিণমুখী আবাসিক প্লট'
                      : 'e.g. Prime 5 Katha South-Facing Residential Plot in Purbachal'
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Land Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'জমির ধরন *' : 'Land Type *'}
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as ListingPropertyType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Residential">{language === 'bn' ? 'আবাসিক (Residential)' : 'Residential'}</option>
                    <option value="Commercial">{language === 'bn' ? 'বাণিজ্যিক (Commercial)' : 'Commercial'}</option>
                    <option value="Agricultural">{language === 'bn' ? 'কৃষি জমি (Agricultural)' : 'Agricultural'}</option>
                    <option value="Industrial">{language === 'bn' ? 'শিল্প কারখানা (Industrial)' : 'Industrial'}</option>
                    <option value="Other">{language === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>

                {/* Asking Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'প্রস্তাবিত মোট মূল্য (BDT ৳) *' : 'Asking Price in BDT (৳) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={priceBdt}
                    onChange={(e) => setPriceBdt(e.target.value)}
                    placeholder="4,500,000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="negotiable-check"
                      checked={isNegotiable}
                      onChange={(e) => setIsNegotiable(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="negotiable-check" className="text-[11px] text-slate-600 font-medium">
                      {language === 'bn' ? 'মূল্য আলোচনা সাপেক্ষ' : 'Price is negotiable'}
                    </label>
                  </div>
                </div>

                {/* Land Area & Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'জমির পরিমাণ ও একক *' : 'Total Land Area & Unit *'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      value={areaValue}
                      onChange={(e) => setAreaValue(e.target.value)}
                      placeholder="5.5"
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value as ListingAreaUnit)}
                      className="w-28 p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                    >
                      <option value="Decimal">Decimal (শতাংশ)</option>
                      <option value="Katha">Katha (কাঠা)</option>
                      <option value="Bigha">Bigha (বিঘা)</option>
                      <option value="Acre">Acre (একর)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'bn' ? '২. জমির সঠিক অবস্থান' : '2. Land Location & Jurisdiction'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'জেলা *' : 'District *'}
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d.en} value={d.en}>
                      {d.en} ({d.bn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'উপজেলা / থানা *' : 'Upazila / Thana *'}
                </label>
                <input
                  type="text"
                  required
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  placeholder="e.g. Savar, Rupganj, Tongi"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'মৌজা *' : 'Mouza *'}
                </label>
                <input
                  type="text"
                  required
                  value={mouza}
                  onChange={(e) => setMouza(e.target.value)}
                  placeholder="e.g. Ashulia, Purbachal Model Town"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'বিস্তারিত ঠিকানা বা অবস্থানের বিবরণ *' : 'Full Location Description & Address *'}
              </label>
              <textarea
                rows={2}
                required
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'প্লট নং, রোড নং, সেক্টর, বা পৌঁছানোর সঠিক দিক-নির্দেশনা লিখুন...'
                    : 'Sector 21, Road 302, Plot #14, near Central Lake...'
                }
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {language === 'bn' ? 'অক্ষাংশ (Latitude - ঐচ্ছিক)' : 'Latitude (Optional)'}
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 23.8342"
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {language === 'bn' ? 'দ্রাঘিমাংশ (Longitude - ঐচ্ছিক)' : 'Longitude (Optional)'}
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 90.5218"
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Property Details & Legal Identifiers */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'bn' ? '৩. জমির বিবরণ ও খতিয়ান সংক্রান্ত তথ্য' : '3. Property Narrative & Survey Identifiers'}
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'bn' ? 'জমির বিস্তারিত বর্ণনা (কমপক্ষে ১৫ অক্ষর) *' : 'Comprehensive Description (min 15 chars) *'}
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'জমির ভরাট অবস্থা, সীমানা প্রাচীর, মাটির ধরন, পরিবেশ এবং ভবিষ্যৎ সম্ভাবনার কথা লিখুন...'
                    : 'Detail the topography, boundary walls, soil quality, neighborhood features, and readiness for development...'
                }
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'রাস্তা সংযোগের বিবরণ' : 'Road Access Information'}
                </label>
                <input
                  type="text"
                  value={roadAccess}
                  onChange={(e) => setRoadAccess(e.target.value)}
                  placeholder="e.g. 40 ft wide paved avenue connecting to main road"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'নিকটবর্তী প্রধান ল্যান্ডমার্ক' : 'Nearby Landmarks'}
                </label>
                <input
                  type="text"
                  value={nearbyLandmarks}
                  onChange={(e) => setNearbyLandmarks(e.target.value)}
                  placeholder="e.g. Near Lake Park, Sector 21 Central Mosque"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Legal Identifiers */}
            <div className="pt-2">
              <span className="block text-xs font-bold text-slate-700 mb-2">
                {language === 'bn' ? 'সরকারি ভূমি রেকর্ড পরিচিতি (ঐচ্ছিক কিন্তু সুপারিশকৃত)' : 'Government Survey Identifiers (Recommended)'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {language === 'bn' ? 'খতিয়ান নং' : 'Khatian Number'}
                  </label>
                  <input
                    type="text"
                    value={khatianNo}
                    onChange={(e) => setKhatianNo(e.target.value)}
                    placeholder="e.g. RS-418"
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {language === 'bn' ? 'দাগ নং' : 'Dag Number'}
                  </label>
                  <input
                    type="text"
                    value={dagNo}
                    onChange={(e) => setDagNo(e.target.value)}
                    placeholder="e.g. 782"
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {language === 'bn' ? 'জে এল নং' : 'JL Number'}
                  </label>
                  <input
                    type="text"
                    value={jlNumber}
                    onChange={(e) => setJlNumber(e.target.value)}
                    placeholder="e.g. 88"
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Utilities Checkboxes */}
            <div className="pt-2">
              <span className="block text-xs font-bold text-slate-700 mb-2">
                {language === 'bn' ? 'বিদ্যমান ইউটিলিটি সুবিধাসমূহ' : 'Available Utilities'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {utilityOptions.map((util) => (
                  <label
                    key={util}
                    className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUtilities.includes(util)}
                      onChange={() => handleToggleUtility(util)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{util}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Images & Supporting Documents */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'bn' ? '৪. ছবি ও গোপনীয় প্রমাণপত্র' : '4. Property Photographs & Verification Evidence'}
              </h2>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'জমির বাস্তব ছবিসমূহ (একটি কভার ছবি হিসেবে নির্বাচন করুন)' : 'Property Photos (Select one as cover)'}
                </span>
                <span className="text-[11px] text-slate-400">
                  JPEG, PNG, WEBP &lt; 5MB
                </span>
              </div>

              {/* Upload Trigger Dropzone */}
              <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-emerald-600 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  {language === 'bn' ? 'ছবি যুক্ত করতে ক্লিক করুন' : 'Click to Upload Land Photos'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'bn' ? 'একাধিক ছবি আপলোড করতে পারেন' : 'You can select multiple photos'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>

              {/* Image Previews Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`relative rounded-xl overflow-hidden border-2 bg-slate-900 group ${
                        img.isCover ? 'border-emerald-600 shadow-md ring-2 ring-emerald-400/40' : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={img.storagePath}
                        alt="Preview"
                        className="w-full h-24 object-cover"
                      />

                      {/* Cover Badge */}
                      {img.isCover && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                          COVER
                        </span>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full cursor-pointer transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Set as Cover Button */}
                      {!img.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(img.id)}
                          className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 hover:bg-emerald-600 text-white text-[10px] font-bold py-0.5 rounded cursor-pointer transition-colors text-center"
                        >
                          {language === 'bn' ? 'কভার করুন' : 'Make Cover'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confidential Supporting Documents Area */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800">
                  {language === 'bn' ? 'গোপনীয় সরকারি প্রমাণপত্র (শুধুমাত্র ভূমি অফিসার পর্যালোচনার জন্য)' : 'Confidential Supporting Deeds & Porcha (Officer Review Only)'}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {language === 'bn'
                  ? 'খতিয়ান, খারিজ পর্চা বা দলিলের কপি যুক্ত করুন। এই ফাইলগুলো কখনোই সাধারণ পাবলিক ক্রেতাদের কাছে উন্মুক্ত করা হবে না; কেবল আমাদের ভূমি অফিসার যাচাই করবেন।'
                  : 'Upload title deeds, mutation porcha, or dcr duplicates. These documents remain strictly private and accessible only to authorized Land Officers.'}
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>{language === 'bn' ? 'পিডিএফ বা দলিল ফাইল যুক্ত করুন' : 'Attach PDF / Deed File'}</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleDocFileChange}
                  className="hidden"
                />
              </label>

              {documents.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{doc.fileName}</span>
                        <span className="text-[10px] text-slate-400">
                          ({(doc.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Seller Contact & Privacy */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Phone className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                {language === 'bn' ? '৫. বিক্রেতার যোগাযোগ ও গোপনীয়তা' : '5. Seller Contact Information & Privacy'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'বিক্রেতার নাম' : 'Seller Name'}
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.fullName || 'Mohammad Rafiqul Islam'}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {language === 'bn' ? 'যোগাযোগের মোবাইল নম্বর *' : 'Contact Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="01712-XXXXXX"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">
                  {language === 'bn'
                    ? 'বিজ্ঞাপনের পাতায় ক্রেতাদের জন্য ফোন নম্বর প্রদর্শন করুন'
                    : 'Display phone number publicly on the listing page'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-800">
                <input
                  type="checkbox"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">
                  {language === 'bn'
                    ? 'বিজ্ঞাপনের পাতায় ইমেইল ঠিকানা প্রদর্শন করুন'
                    : 'Display email address publicly on the listing page'}
                </span>
              </label>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/buy-land"
              className="px-6 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Link>

            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{language === 'bn' ? 'বিজ্ঞাপন পর্যালোচনা ও নিশ্চিত করুন' : 'Review & Publish Listing'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                {language === 'bn' ? 'বিজ্ঞাপন তথ্য নিশ্চিতকরণ' : 'Confirm Listing Submission'}
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'শিরোনাম:' : 'Title:'}</span>
                  <span className="font-bold text-slate-900 text-right max-w-xs truncate">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'ধরন ও পরিমাণ:' : 'Type & Area:'}</span>
                  <span className="font-bold text-slate-800">{propertyType} • {areaValue} {areaUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'প্রস্তাবিত মূল্য:' : 'Asking Price:'}</span>
                  <span className="font-extrabold text-emerald-700">৳ {parseFloat(priceBdt).toLocaleString('en-IN')} BDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'অবস্থান:' : 'Location:'}</span>
                  <span className="font-medium text-slate-800">{mouza}, {upazila}, {district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'bn' ? 'প্রাথমিক অবস্থা:' : 'Initial Status:'}</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Pending Review
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>{language === 'bn' ? 'বিজ্ঞপ্তি:' : 'Notice:'}</strong>{' '}
                {language === 'bn'
                  ? 'জমা দেওয়ার পর বিজ্ঞাপনটি অবিলম্বে "Pending Review" স্ট্যাটাসে সংরক্ষিত হবে। ভূমি অফিসার পর্যালোচনা সম্পন্ন না করা পর্যন্ত এটি জনসাধারণের কাছে প্রদর্শিত হবে না।'
                  : 'Submitting will save your listing with status "Pending Review". It will only appear in public search results once approved by moderation.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                {language === 'bn' ? 'সংশোধন করুন' : 'Edit Information'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'bn' ? 'নিশ্চিত করুন ও প্রকাশ করুন' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
