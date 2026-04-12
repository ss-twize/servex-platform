'use client';

import React from 'react';

interface SortableHeaderProps {
  label: string;
  field: string;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: SortableHeaderProps) {
  const isActive = sortField === field;

  const indicator = isActive ? (sortDir === 'asc' ? '↑' : '↓') : '↕';

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={[
        'flex items-center gap-1 text-xs uppercase tracking-wide font-medium',
        'transition-colors duration-150 focus:outline-none',
        isActive ? 'text-[#EDF2FA]' : 'text-[#5E7488] hover:text-[#EDF2FA]',
      ].join(' ')}
    >
      <span>{label}</span>
      <span
        className={[
          'text-[10px] leading-none',
          isActive ? 'text-[#00FF00]' : 'text-[#5E7488]',
        ].join(' ')}
      >
        {indicator}
      </span>
    </button>
  );
}

export default SortableHeader;
