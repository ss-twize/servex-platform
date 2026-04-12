'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'
import { usePeriod } from '@/lib/contexts/PeriodContext'

export interface ChartDataPoint {
  date: string
  revenue: number
  appointments: number
  newClients: number
}

export function useMetricsChart() {
  const { dateFrom, dateTo } = usePeriod()
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()

    async function load() {
      try {
        const { data } = await supabase
          .from('metrics_day')
          .select('date, revenue, appointments, new_clients')
          .eq('org_uid', DEFAULT_ORG_UID)
          .gte('date', dateFromStr)
          .lte('date', dateToStr)
          .order('date', { ascending: true })

        const points: ChartDataPoint[] = (data ?? []).map((row) => ({
          date: row.date as string,
          revenue: row.revenue ?? 0,
          appointments: row.appointments ?? 0,
          newClients: row.new_clients ?? 0,
        }))

        setChartData(points)
      } catch {
        setChartData([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [dateFromStr, dateToStr])

  return { chartData, loading }
}
