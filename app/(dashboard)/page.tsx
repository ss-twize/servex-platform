'use client'

import MetricsRow from '@/components/dashboard/MetricsRow'
import RevenueChart from '@/components/charts/RevenueChart'
import QuickStats from '@/components/dashboard/QuickStats'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import AttentionBlock from '@/components/dashboard/AttentionBlock'
import { useMetricsChart } from '@/lib/hooks/useMetricsChart'

export default function DashboardPage() {
  const { chartData, loading: chartLoading } = useMetricsChart()

  return (
    <div className="p-6 space-y-6">
      <MetricsRow />
      <RevenueChart data={chartData} loading={chartLoading} />
      <QuickStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <AttentionBlock />
      </div>
    </div>
  )
}
