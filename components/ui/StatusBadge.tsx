'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant: 'appointment' | 'client';
}

type StyleConfig = {
  bg: string;
  text: string;
  label: string;
};

const APPOINTMENT_STYLES: Record<string, StyleConfig> = {
  подтверждена: {
    bg: 'bg-green-500/15',
    text: 'text-green-400',
    label: 'Подтверждена',
  },
  ожидает: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    label: 'Ожидает',
  },
  'ожидает подтверждения': {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    label: 'Ожидает подтверждения',
  },
  отменена: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    label: 'Отменена',
  },
  неявка: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    label: 'Неявка',
  },
  завершена: {
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    label: 'Завершена',
  },
};

const CLIENT_STYLES: Record<string, StyleConfig> = {
  new: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Новый' },
  новый: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Новый' },
  active: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Активный' },
  активный: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Активный' },
  at_risk: { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Под риском' },
  'под риском': { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Под риском' },
  lost: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Потерянный' },
  потерянный: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Потерянный' },
  vip: { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'ВИП' },
};

const DEFAULT_STYLE: StyleConfig = {
  bg: 'bg-[#223444]/50',
  text: 'text-[#8299B4]',
  label: '',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const map = variant === 'appointment' ? APPOINTMENT_STYLES : CLIENT_STYLES;
  const key = status.toLowerCase();
  const config = map[key] ?? DEFAULT_STYLE;
  const label = config.label || status;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
