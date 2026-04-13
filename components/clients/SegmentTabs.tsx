'use client'

import React from 'react'
import { ClientSegmentCounts } from '@/lib/hooks/useClients'

interface Tab {
  value: string
  label: string
  count: number
}

interface SegmentTabsProps {
  counts: ClientSegmentCounts
  activeSegment: string
  onChange: (segment: string) => void
}

export function SegmentTabs({ counts, activeSegment, onChange }: SegmentTabsProps) {
  const tabs: Tab[] = [
    { value: '', label: 'Все', count: counts.total },
    { value: 'new', label: 'Новые', count: counts.new },
    { value: 'active', label: 'Активные', count: counts.active },
    { value: 'at_risk', label: 'Под риском', count: counts.at_risk },
    { value: 'lost', label: 'Потерянные', count: counts.lost },
    { value: 'vip', label: 'ВИП', count: counts.vip },
    { value: 'can_message', label: 'Можно писать', count: counts.can_message },
    { value: 'no_message', label: 'Нельзя писать', count: counts.total - counts.can_message },
  ]

  return (
    <div className="overflow-x-auto flex gap-2 pb-1 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeSegment === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap',
              'transition-colors duration-150 focus:outline-none',
              isActive
                ? 'bg-[#00FF00] text-black'
                : 'bg-[#141E2B] text-[#5E7488] hover:text-[#EDF2FA] border border-[#223444]',
            ].join(' ')}
          >
            <span>{tab.label}</span>
            <span
              className={[
                'inline-flex items-center justify-center rounded-full text-[10px] font-semibold min-w-[18px] h-[18px] px-1',
                isActive
                  ? 'bg-black/20 text-black'
                  : 'bg-[#223444] text-[#8299B4]',
              ].join(' ')}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default SegmentTabs
