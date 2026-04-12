'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import EmptyState from '@/components/ui/EmptyState'
import type { ChartDataPoint } from '@/lib/hooks/useMetricsChart'

type Metric = 'revenue' | 'appointments' | 'newClients'

interface RevenueChartProps {
  data: ChartDataPoint[]
  loading: boolean
}

const METRICS: { key: Metric; label: string }[] = [
  { key: 'revenue', label: 'Выручка' },
  { key: 'appointments', label: 'Записи' },
  { key: 'newClients', label: 'Новые клиенты' },
]

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}.${month}`
}

function formatValue(value: number, metric: Metric): string {
  if (metric === 'revenue') {
    return `${value.toLocaleString('ru-RU')} ₽`
  }
  return String(value)
}

interface CustomTooltipProps {
  active?: boolean
  payload?: ReadonlyArray<{ value: number }>
  label?: string
  metric: Metric
}

function CustomTooltip({ active, payload, label, metric }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#141E2B] border border-[#223444] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-[#5E7488] mb-1">{label}</p>
      <p className="text-[#EDF2FA] font-medium">{formatValue(payload[0].value, metric)}</p>
    </div>
  )
}

export default function RevenueChart({ data, loading }: RevenueChartProps) {
  const [activeMetric, setActiveMetric] = useState<Metric>('revenue')

  const isEmpty = !loading && data.length === 0

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4">
      {/* Header with switcher */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-sm font-unbounded text-[#EDF2FA]">Динамика</h2>
        <div className="flex gap-1">
          {METRICS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeMetric === key
                  ? 'bg-[#00FF00] text-black'
                  : 'text-[#5E7488] hover:text-[#EDF2FA]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {loading ? (
        <div className="h-[280px] flex items-center justify-center">
          <div className="w-full h-full bg-[#0A0D14] rounded-lg animate-pulse" />
        </div>
      ) : isEmpty ? (
        <div className="h-[280px] flex items-center justify-center">
          <EmptyState message="Нет данных за выбранный период" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF00" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00FF00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#223444" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: '#5E7488', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#5E7488', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as ReadonlyArray<{ value: number }> | undefined}
                  label={props.label as string | undefined}
                  metric={activeMetric}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke="#00FF00"
              strokeWidth={2}
              fill="url(#colorMetric)"
              dot={false}
              activeDot={{ r: 4, fill: '#00FF00', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
