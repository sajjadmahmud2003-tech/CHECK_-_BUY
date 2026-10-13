'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Languages,
  UserCheck,
  Upload,
} from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, quickDemoLogin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.navHome, icon: ShieldCheck },
    { href: '/search', label: t.navSearch, icon: Search },
    { href: '/verify', label: t.navVerify, icon: ShieldAlert },
    { href: '/upload', label: t.navUpload, icon: Upload },
    { href: '/dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { href: '/admin', label: t.navAdmin, icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
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

            {/* Quick Demo Role Switcher for Hackathon Judges */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold border border-emerald-300 transition-colors"
                title="Quick Role Switcher for Hackathon Evaluation"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="capitalize">{user?.role || 'Citizen'}</span>
                <span className="text-[10px] text-emerald-600">▾</span>
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs"
                  onClick={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1 font-bold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => quickDemoLogin('citizen')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      user?.role === 'citizen' ? 'font-bold text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <span>Citizen Buyer</span>
                    {user?.role === 'citizen' && <span className="text-emerald-600">✓</span>}
                  </button>
                  <button
                    onClick={() => quickDemoLogin('officer')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      user?.role === 'officer' ? 'font-bold text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <span>Land Officer / Legal</span>
                    {user?.role === 'officer' && <span className="text-emerald-600">✓</span>}
                  </button>
                  <button
                    onClick={() => quickDemoLogin('admin')}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between ${
                      user?.role === 'admin' ? 'font-bold text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <span>GovTech Admin</span>
                    {user?.role === 'admin' && <span className="text-emerald-600">✓</span>}
                  </button>
                </div>
              )}
            </div>

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
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
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
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Demo Role: {user?.role}</span>
            <div className="flex gap-1">
              <button
                onClick={() => quickDemoLogin('citizen')}
                className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium"
              >
                Citizen
              </button>
              <button
                onClick={() => quickDemoLogin('admin')}
                className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-medium"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
