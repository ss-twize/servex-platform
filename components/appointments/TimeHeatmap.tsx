'use client'

import React, { useMemo } from 'react'
import { Appointment } from '@/lib/hooks/useAppointments'
import { EmptyState } from '@/components/ui/EmptyState'

interface TimeHeatmapProps {
  appointments: Appointment[]
  loading: boolean
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 9) // 9..21
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
// JS getDay(): 0=Sun,1=Mon,...,6=Sat → map to Mon=0..Sun=6
function jsDayToIdx(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

function cellColor(count: number): string {
  if (count === 0) return '#141E2B'
  if (count <= 2) return '#1a3a1a'
  if (count <= 5) return '#0d5c0d'
  return '#00FF00'
}

function SkeletonHeatmap() {
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="grid gap-1" style={{ minWidth: 380 }}>
        {/* header row */}
        <div className="flex gap-1 ml-12">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="flex-1 h-5 rounded bg-[#223444] animate-pulse"
            />
          ))}
        </div>
        {HOURS.map((h) => (
          <div key={h} className="flex gap-1 items-center">
            <div className="w-10 h-5 rounded bg-[#223444] animate-pulse flex-shrink-0" />
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="flex-1 h-7 rounded bg-[#223444] animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function TimeHeatmap({ appointments, loading }: TimeHeatmapProps) {
  // Build a map: dayIdx (0=Пн..6=Вс) x hour → count
  const grid = useMemo(() => {
    const map: Record<string, number> = {}
    for (const appt of appointments) {
      if (!appt.date) continue
      const d = new Date(appt.date)
      if (isNaN(d.getTime())) continue
      const hour = d.getHours()
      if (hour < 9 || hour > 21) continue
      const dayIdx = jsDayToIdx(d.getDay())
      const key = `${dayIdx}-${hour}`
      map[key] = (map[key] ?? 0) + 1
    }
    return map
  }, [appointments])

  const maxCount = useMemo(
    () => Math.max(0, ...Object.values(grid)),
    [grid],
  )

  const isEmpty = !loading && appointments.length === 0

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-unbounded text-sm text-[#EDF2FA]">
          Загрузка по времени
        </h2>
        {/* legend */}
        {!loading && !isEmpty && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#5E7488]">0</span>
            {['#1a3a1a', '#0d5c0d', '#00FF00'].map((c) => (
              <span
                key={c}
                className="inline-block w-4 h-4 rounded"
                style={{ backgroundColor: c }}
              />
            ))}
            <span className="text-[10px] text-[#5E7488]">{maxCount}+</span>
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonHeatmap />
      ) : isEmpty ? (
        <EmptyState message="Нет данных для тепловой карты" />
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: 340 }}>
            {/* Day header */}
            <div className="flex gap-1 mb-1 ml-12">
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="flex-1 text-center text-[10px] text-[#5E7488] font-medium"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Hour rows */}
            {HOURS.map((hour) => (
              <div key={hour} className="flex gap-1 mb-1 items-center">
                <span className="text-[10px] text-[#5E7488] w-10 flex-shrink-0 text-right pr-1">
                  {hour}:00
                </span>
                {DAY_LABELS.map((_, dayIdx) => {
                  const count = grid[`${dayIdx}-${hour}`] ?? 0
                  return (
                    <div
                      key={dayIdx}
                      title={`${DAY_LABELS[dayIdx]} ${hour}:00 — ${count} зап.`}
                      className="flex-1 h-7 rounded transition-colors duration-200 cursor-default flex items-center justify-center"
                      style={{ backgroundColor: cellColor(count) }}
                    >
                      {count > 0 && (
                        <span
                          className="text-[10px] font-medium"
                          style={{
                            color: count >= 6 ? '#0A0D14' : '#8fbe8f',
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeHeatmap
