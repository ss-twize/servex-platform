'use client'

import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { usePeriod } from '@/lib/contexts/PeriodContext'
import { AlertCircle, XCircle, UserMinus, CalendarX, Zap } from 'lucide-react'

interface QuickStatItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  accent?: string
}

function QuickStatItem({ icon, label, value, subtitle, accent = '#EDF2FA' }: QuickStatItemProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#0A0D14] flex items-center justify-center" style={{ color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-unbounded leading-tight" style={{ color: accent }}>
          {value}
        </div>
        <div className="text-xs text-[#5E7488] truncate">{label}</div>
        {subtitle && <div className="text-xs text-[#5E7488] opacity-60">{subtitle}</div>}
      </div>
    </div>
  )
}

export default function QuickStats() {
  const { dateFrom, dateTo } = usePeriod()
  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]
  const stats = useDashboardStats(dateFromStr, dateToStr)

  if (stats.loading) {
    return (
      <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4">
        <div className="flex gap-6 flex-wrap animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#223444]" />
              <div className="flex flex-col gap-1">
                <div className="h-5 w-8 bg-[#223444] rounded" />
                <div className="h-3 w-24 bg-[#223444] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4">
      <h2 className="text-sm font-unbounded text-[#EDF2FA] mb-4">Быстрый обзор</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <QuickStatItem
          icon={<AlertCircle size={16} />}
          label="Ждут подтверждения"
          value={stats.pendingConfirmation}
          accent="#F59E0B"
        />
        <QuickStatItem
          icon={<XCircle size={16} />}
          label="Отмены"
          value={stats.cancellations}
          accent="#EF4444"
        />
        <QuickStatItem
          icon={<UserMinus size={16} />}
          label="Под риском оттока"
          value={stats.atRiskCount}
          accent="#EF4444"
        />
        <QuickStatItem
          icon={<CalendarX size={16} />}
          label="Записи вне графика"
          value="—"
          subtitle="скоро"
          accent="#5E7488"
        />
        <QuickStatItem
          icon={<Zap size={16} />}
          label="Скорость ответа"
          value="—"
          subtitle="скоро"
          accent="#5E7488"
        />
      </div>
    </div>
  )
}
