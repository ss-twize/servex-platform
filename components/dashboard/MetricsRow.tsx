'use client'

import { TrendingUp, Calendar, UserPlus, Target, Receipt, UserX, RefreshCw, Clock } from 'lucide-react'
import MetricCard from '@/components/ui/MetricCard'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { usePeriod } from '@/lib/contexts/PeriodContext'

function SkeletonCard() {
  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-3 bg-[#223444] rounded w-2/3" />
      <div className="h-7 bg-[#223444] rounded w-1/2 mt-1" />
    </div>
  )
}

export default function MetricsRow() {
  const { dateFrom, dateTo } = usePeriod()
  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]
  const stats = useDashboardStats(dateFromStr, dateToStr)

  if (stats.loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        title="Выручка"
        value={`${stats.revenue.toLocaleString('ru-RU')} ₽`}
        icon={<TrendingUp size={16} />}
        isEmpty={stats.isEmpty}
      />
      <MetricCard
        title="Записей"
        value={stats.appointments}
        icon={<Calendar size={16} />}
        isEmpty={stats.isEmpty}
      />
      <MetricCard
        title="Новых клиентов"
        value={stats.newClients}
        icon={<UserPlus size={16} />}
        isEmpty={stats.isEmpty}
      />
      <MetricCard
        title="Конверсия"
        value={stats.conversionRate > 0 ? `${stats.conversionRate.toFixed(1)}%` : '—'}
        icon={<Target size={16} />}
        isEmpty={stats.isEmpty || (stats.conversionRate === 0 && stats.appointments === 0)}
      />
      <MetricCard
        title="Средний чек"
        value={`${stats.avgCheck.toLocaleString('ru-RU')} ₽`}
        icon={<Receipt size={16} />}
        isEmpty={stats.isEmpty || stats.avgCheck === 0}
      />
      <MetricCard
        title="Неявки"
        value={stats.noShows}
        icon={<UserX size={16} />}
        isEmpty={stats.isEmpty}
      />
      <MetricCard
        title="Возвращённых"
        value={stats.returnedClients}
        icon={<RefreshCw size={16} />}
        isEmpty={stats.isEmpty}
      />
      <MetricCard
        title="Сэкономлено времени"
        value={`${Math.round(stats.savedTime / 60)} ч`}
        subtitle="оценка по контактам"
        icon={<Clock size={16} />}
        isEmpty={stats.isEmpty || stats.savedTime === 0}
      />
    </div>
  )
}
