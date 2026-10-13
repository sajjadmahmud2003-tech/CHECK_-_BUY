import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DemoBanner from '@/components/DemoBanner';

export const metadata: Metadata = {
  title: 'LandCheck AI — Smart Land Verification & Risk Screening Platform (Bangladesh)',
  description:
    'Citizen-friendly decision support platform for pre-purchase land due diligence in Bangladesh. Cross-examine CS, SA, RS, BS survey chains, verify mutation status, and detect title discrepancies before you buy.',
  keywords: [
    'LandCheck AI',
    'Bangladesh Land Verification',
    'Landtech Innovation Hackathon 2026',
    'Check Before You Buy',
    'CS Khatian',
    'SA Khatian',
    'RS Khatian',
    'BS Khatian',
    'Namzari Mutation',
    'AC Land',
    'Bhumi Bhaban',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <LanguageProvider>
          <AuthProvider>
            <DemoBanner />
            <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
