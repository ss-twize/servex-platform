'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface MetricCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  isEmpty?: boolean;
}

function TooltipPortal({
  children,
  anchor,
}: {
  children: React.ReactNode;
  anchor: React.RefObject<HTMLElement | null>;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    if (!anchor.current) return;
    const rect = anchor.current.getBoundingClientRect();
    const tipWidth = tooltipRef.current?.offsetWidth ?? 160;
    let left = rect.left + rect.width / 2;
    // clamp horizontally
    left = Math.max(tipWidth / 2 + 8, Math.min(left, window.innerWidth - tipWidth / 2 - 8));
    setPos({ top: rect.bottom + 8, left });
  }, [anchor]);

  useEffect(() => {
    reposition();
  }, [reposition]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
      className="fixed z-50 max-w-[200px] rounded-lg bg-[#1A2535] border border-[#223444] px-3 py-2 text-xs text-[#EDF2FA] shadow-lg pointer-events-none whitespace-normal"
    >
      {children}
    </div>,
    document.body,
  );
}

export function MetricCard({ title, value, subtitle, icon, tooltip, isEmpty }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);

  const displayValue = isEmpty ? null : (value ?? null);

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4 flex flex-col gap-2 relative">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-[#5E7488] font-medium">{title}</span>
        {icon && (
          <button
            ref={iconRef}
            type="button"
            className="flex-shrink-0 text-[#5E7488] hover:text-[#8299B4] transition-colors focus:outline-none"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            aria-label={tooltip ?? title}
          >
            {icon}
          </button>
        )}
      </div>

      {/* Value */}
      <div className="flex flex-col gap-1">
        {isEmpty || displayValue === null ? (
          <span className="text-[#5E7488] text-sm">Нет данных</span>
        ) : (
          <span className="text-2xl font-unbounded text-[#EDF2FA] leading-tight">
            {displayValue}
          </span>
        )}
        {subtitle && !isEmpty && (
          <span className="text-xs text-[#5E7488]">{subtitle}</span>
        )}
      </div>

      {/* Tooltip portal */}
      {showTooltip && tooltip && (
        <TooltipPortal anchor={iconRef}>{tooltip}</TooltipPortal>
      )}
    </div>
  );
}

export default MetricCard;
