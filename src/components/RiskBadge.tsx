'use client';

import React from 'react';
import { RiskSeverity } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  severity: RiskSeverity;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function RiskBadge({ severity, size = 'md', showIcon = true }: RiskBadgeProps) {
  const { language } = useLanguage();

  const configs = {
    low: {
      en: 'Low Concern',
      bn: 'স্বল্প ঝুঁকি',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-600/10',
      icon: CheckCircle2,
      dotColor: 'bg-emerald-500',
    },
    medium: {
      en: 'Needs Review',
      bn: 'পর্যালোচনা প্রয়োজন',
      bg: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-600/10',
      icon: AlertTriangle,
      dotColor: 'bg-amber-500',
    },
    high: {
      en: 'High Priority Review',
      bn: 'উচ্চ ঝুঁকি (সতর্কতা)',
      bg: 'bg-rose-50 text-rose-800 border-rose-300 ring-rose-600/10',
      icon: AlertOctagon,
      dotColor: 'bg-rose-500',
    },
  };

  const current = configs[severity] || configs.low;
  const Icon = current.icon;
  const label = language === 'bn' ? current.bn : current.en;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs ring-1 ring-inset ${current.bg} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} shrink-0`} />}
      <span>{label}</span>
    </span>
  );
}
