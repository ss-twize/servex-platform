'use client'

import React from 'react'
import { AppointmentStats } from '@/lib/hooks/useAppointments'
import { EmptyState } from '@/components/ui/EmptyState'

interface AppointmentFunnelProps {
  stats: AppointmentStats
  loading: boolean
}

interface FunnelStage {
  label: string
  value: number
  color: string
}

function SkeletonFunnel() {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {[90, 75, 55, 40, 40].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 h-3 rounded bg-[#223444] animate-pulse flex-shrink-0" />
          <div
            className="h-7 rounded bg-[#223444] animate-pulse"
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  )
}

export function AppointmentFunnel({ stats, loading }: AppointmentFunnelProps) {
  const visited = Math.max(0, stats.confirmed - stats.noShow)

  const stages: FunnelStage[] = [
    { label: 'Записей создано', value: stats.total, color: '#00FF00' },
    { label: 'Подтверждено', value: stats.confirmed, color: '#22c55e' },
    { label: 'Визит состоялся', value: visited, color: '#16a34a' },
    { label: 'Отменено', value: stats.cancelled, color: '#ef4444' },
    { label: 'Неявки', value: stats.noShow, color: '#f97316' },
  ]

  const maxValue = Math.max(...stages.map((s) => s.value), 1)
  const isEmpty = !loading && stats.total === 0

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4 flex flex-col gap-4 h-full">
      <h2 className="font-unbounded text-sm text-[#EDF2FA]">Воронка записей</h2>

      {loading ? (
        <SkeletonFunnel />
      ) : isEmpty ? (
        <EmptyState message="Нет данных для воронки" />
      ) : (
        <div className="flex flex-col gap-3">
          {stages.map((stage) => {
            const pct = Math.round((stage.value / maxValue) * 100)
            const convPct =
              stats.total > 0
                ? Math.round((stage.value / stats.total) * 100)
                : 0

            return (
              <div key={stage.label} className="flex items-center gap-3">
                {/* Label */}
                <span className="text-xs text-[#8299B4] w-32 flex-shrink-0 text-right leading-tight">
                  {stage.label}
                </span>

                {/* Bar + value */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-[#141E2B] rounded h-7 overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: stage.color,
                        opacity: stage.value === 0 ? 0.2 : 0.85,
                        minWidth: stage.value > 0 ? '32px' : '0',
                      }}
                    >
                      {stage.value > 0 && (
                        <span className="text-[11px] font-medium text-[#0A0D14]">
                          {stage.value}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#5E7488] w-10 text-right flex-shrink-0">
                    {convPct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AppointmentFunnel
