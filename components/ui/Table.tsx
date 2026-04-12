'use client';

import React from 'react';
import EmptyState from './EmptyState';

interface TableProps {
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  isEmpty?: boolean;
  emptyMessage?: string;
  loading?: boolean;
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {[0, 1, 2].map((rowIdx) => (
        <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-[#0A0D14]/40'}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <div className="h-4 rounded bg-[#223444] animate-pulse" style={{ width: `${60 + (colIdx * 13) % 30}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function Table({
  headers,
  rows,
  isEmpty,
  emptyMessage = 'Нет данных за выбранный период',
  loading = false,
}: TableProps) {
  const colCount = headers.length;

  return (
    <div className="overflow-x-auto w-full rounded-xl border border-[#223444]">
      <table className="w-full min-w-[480px] border-collapse">
        {/* Sticky header */}
        <thead className="sticky top-0 z-10 bg-[#0F1622]">
          <tr className="border-b border-[#223444]">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-xs text-[#8299B4] uppercase tracking-wide font-medium whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <SkeletonRows cols={colCount} />
          ) : isEmpty || rows.length === 0 ? (
            <tr>
              <td colSpan={colCount}>
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          ) : (
            rows.map((cells, rowIdx) => (
              <tr
                key={rowIdx}
                className={[
                  'border-b border-[#223444]/50 last:border-0',
                  'transition-colors duration-100 hover:bg-[#141E2B]',
                  rowIdx % 2 !== 0 ? 'bg-[#0A0D14]/30' : 'bg-transparent',
                ].join(' ')}
              >
                {cells.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-4 py-3 text-sm text-[#EDF2FA] whitespace-nowrap"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
