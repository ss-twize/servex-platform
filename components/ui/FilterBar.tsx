'use client';

import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function FilterBar({ filters, values, onChange }: FilterBarProps) {
  const hasActiveFilter = filters.some(
    (f) => values[f.key] && values[f.key] !== '',
  );

  function handleReset() {
    filters.forEach((f) => onChange(f.key, ''));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-col gap-0.5">
          <label
            htmlFor={`filter-${filter.key}`}
            className="text-[10px] uppercase tracking-wide text-[#5E7488] px-1"
          >
            {filter.label}
          </label>
          <select
            id={`filter-${filter.key}`}
            value={values[filter.key] ?? ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className={[
              'bg-[#0F1622] border border-[#223444] text-[#EDF2FA] rounded-lg px-3 py-2',
              'text-sm appearance-none pr-8 cursor-pointer',
              'hover:border-[#8299B4] focus:outline-none focus:border-[#00FF00]',
              'transition-colors duration-150',
              // Custom arrow via background image workaround using a pseudo — instead use inline style
            ].join(' ')}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238299B4' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="">Все</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasActiveFilter && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 text-sm text-[#5E7488] hover:text-[#EDF2FA] transition-colors duration-150 px-2 py-2 rounded-lg hover:bg-[#141E2B]"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}

export default FilterBar;
