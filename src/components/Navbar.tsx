'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Search,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  Menu,
  X,
  Upload,
  FileCheck2,
  UserCheck,
  User,
  LogOut,
  ChevronDown,
  Bell,
  FilePlus,
  Clock,
  Building2,
  PlusCircle,
  Heart,
  Tag,
} from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    if (user) {
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && typeof data.unreadCount === 'number') {
            setUnreadNotifCount(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const currentRole = mounted && user ? user.role : undefined;

  const navLinks = [
    { href: '/', label: t.navHome, icon: ShieldCheck },
    { href: '/buy-land', label: language === 'bn' ? 'জমি ক্রয়' : 'Buy Land', icon: Building2 },
    { href: '/sell-land', label: language === 'bn' ? 'জমি বিক্রয়' : 'Sell Land', icon: PlusCircle },
    { href: '/search', label: t.navSearch, icon: Search },
    { href: '/verify', label: t.navVerify, icon: ShieldAlert },
    ...(mounted && user
      ? [
          { href: '/apply', label: language === 'bn' ? 'দলিল আবেদন' : 'Apply', icon: FilePlus },
          { href: '/applications', label: language === 'bn' ? 'আমার আবেদন' : 'Applications', icon: Clock },
          { href: '/my-documents', label: language === 'bn' ? 'দলিল ভল্ট' : 'Documents', icon: FileCheck2 },
          { href: '/dashboard', label: t.navDashboard, icon: LayoutDashboard },
          ...(currentRole === 'officer'
            ? [{ href: '/officer', label: language === 'bn' ? 'ভূমি কর্মকর্তা শাখা' : 'Officer Section', icon: FileCheck2 }]
            : []),
          { href: '/admin', label: t.navAdmin, icon: FileText },
          ...(currentRole === 'admin'
            ? [{ href: '/admin/register', label: language === 'bn' ? 'অ্যাডমিন নিবন্ধন' : 'Staff Register', icon: UserCheck }]
            : []),
        ]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-emerald-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                {t.brandName}
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-300">
                  GovTech
                </span>
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:block">
                {language === 'bn' ? 'স্মার্ট জমি যাচাইকরণ' : 'Smart Land Verification'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bilingual Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'en'
                    ? 'bg-white text-emerald-900 shadow-xs font-bold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to English"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'bn'
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="বাংলা ভাষায় দেখুন"
              >
                বাংলা
              </button>
            </div>

            {/* Authentication Buttons (Logged out vs Logged in) */}
            {mounted && (
              <>
                {user ? (
                  /* Logged-In User Actions */
                  <div className="flex items-center gap-2">
                    {/* In-App Notifications Bell */}
                    <Link
                      href="/notifications"
                      id="navbar-notifications-btn"
                      className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadNotifCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white animate-pulse" />
                      )}
                    </Link>

                    {/* User Menu Button */}
                    <div className="relative">
                      <button
                        type="button"
                        id="user-account-menu-btn"
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="max-w-[120px] truncate hidden sm:inline-block">
                          {user.fullName || user.email}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      {userMenuOpen && (
                        <div
                          className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="px-4 py-2 border-b border-slate-100 space-y-0.5">
                            <p className="font-bold text-slate-900 truncate">{user.fullName || 'User'}</p>
                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                            <span className="inline-block mt-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {user.role}
                            </span>
                          </div>

                          <Link
                            href="/profile"
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <User className="w-4 h-4 text-slate-500" />
                            <span>{language === 'bn' ? 'আমার প্রোফাইল' : 'My Profile'}</span>
                          </Link>

                          <Link
                            href="/applications"
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span>{language === 'bn' ? 'আমার আবেদনসমূহ' : 'My Applications'}</span>
                          </Link>

                          <Link
                            href="/my-documents"
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <FileCheck2 className="w-4 h-4 text-slate-500" />
                            <span>{language === 'bn' ? 'অনুমোদিত দলিল ভল্ট' : 'My Approved Documents'}</span>
                          </Link>

                          <Link
                            href="/my-listings"
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <Tag className="w-4 h-4 text-slate-500" />
                            <span>{language === 'bn' ? 'আমার জমির বিজ্ঞাপন' : 'My Land Listings'}</span>
                          </Link>

                          <Link
                            href="/my-interests"
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <Heart className="w-4 h-4 text-slate-500" />
                            <span>{language === 'bn' ? 'আগ্রহী জমির তালিকা' : 'My Saved Interests'}</span>
                          </Link>

                          <Link
                            href="/notifications"
                            className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-slate-500" />
                              <span>{language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}</span>
                            </div>
                            {unreadNotifCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                {unreadNotifCount}
                              </span>
                            )}
                          </Link>

                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                          >
                            <LayoutDashboard className="w-4 h-4 text-slate-500" />
                            <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                          </Link>

                          <div className="border-t border-slate-100 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-rose-50 text-rose-700 font-semibold cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 text-rose-600" />
                              <span>{language === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Logged-Out Options: Login & Sign Up */
                  <div className="hidden sm:flex items-center gap-2">
                    <Link
                      href="/login"
                      id="navbar-login-btn"
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                      {language === 'bn' ? 'লগ ইন' : 'Sign In'}
                    </Link>
                    <Link
                      href="/register"
                      id="navbar-signup-btn"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      {language === 'bn' ? 'রেজিস্ট্রেশন' : 'Sign Up'}
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          {/* Navigation Links */}
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                  active
                    ? 'bg-emerald-50 text-emerald-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Mobile Auth Actions */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate">{user.fullName || user.email}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {user.role}
                  </span>
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-slate-600" />
                    <span>{language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications'}</span>
                  </span>
                  {unreadNotifCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                      {unreadNotifCount}
                    </span>
                  )}
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2 text-center rounded-xl bg-slate-100 font-bold text-xs text-slate-800 hover:bg-slate-200"
                  >
                    {language === 'bn' ? 'প্রোফাইল' : 'Profile'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2 text-center rounded-xl bg-rose-50 font-bold text-xs text-rose-700 hover:bg-rose-100"
                  >
                    {language === 'bn' ? 'লগআউট' : 'Sign Out'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-slate-100 font-bold text-xs text-slate-800 hover:bg-slate-200"
                >
                  {language === 'bn' ? 'লগ ইন' : 'Sign In'}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700"
                >
                  {language === 'bn' ? 'রেজিস্ট্রেশন' : 'Sign Up'}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
