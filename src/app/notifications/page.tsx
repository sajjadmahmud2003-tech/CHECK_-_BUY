'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { InAppNotification } from '@/types';
import { formatDate } from '@/lib/bangla-utils';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  CheckCheck,
  Building2,
  FileText,
  Loader2,
} from 'lucide-react';

export default function NotificationsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const getIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'action_required':
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'rejection':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>GovTech Alerts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {language === 'bn' ? 'বিজ্ঞপ্তি ও নোটিফিকেশন' : 'In-App Notifications'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === 'bn'
              ? 'আপনার দলিলের আবেদন, যাচাই অগ্রগতি এবং অনুমোদনের তাৎক্ষণিক আপডেট।'
              : 'Real-time updates regarding your land document applications and officer reviews.'}
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'সব পঠিত হিসেবে চিহ্নিত করুন' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">{language === 'bn' ? 'নোটিফিকেশন লোড হচ্ছে...' : 'Loading notifications...'}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {language === 'bn' ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No notifications yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {language === 'bn'
              ? 'আপনার আবেদনের স্ট্যাটাস পরিবর্তন হলে এখানে নোটিফিকেশন পাবেন।'
              : 'You will receive notifications here whenever an officer reviews or updates your application.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.isRead && handleMarkOneRead(notif.id)}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                notif.isRead
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {notif.message}
                  </p>
                  <span className="text-[11px] text-slate-400 block pt-1">
                    {formatDate(notif.createdAt, language)}
                  </span>
                </div>
              </div>

              {notif.applicationId && (
                <Link
                  href={`/applications/${notif.applicationId}`}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <span>{language === 'bn' ? 'দেখুন' : 'View'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
