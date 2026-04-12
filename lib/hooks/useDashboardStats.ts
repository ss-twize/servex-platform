'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'

export interface DashboardStats {
  revenue: number
  appointments: number
  newClients: number
  noShows: number
  avgCheck: number
  savedTime: number
  returnedClients: number
  conversionRate: number
  pendingConfirmation: number
  atRiskCount: number
  cancellations: number
  loading: boolean
  isEmpty: boolean
}

const EMPTY_STATS: DashboardStats = {
  revenue: 0,
  appointments: 0,
  newClients: 0,
  noShows: 0,
  avgCheck: 0,
  savedTime: 0,
  returnedClients: 0,
  conversionRate: 0,
  pendingConfirmation: 0,
  atRiskCount: 0,
  cancellations: 0,
  loading: true,
  isEmpty: true,
}

export function useDashboardStats(dateFrom: string, dateTo: string): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)

  useEffect(() => {
    if (!dateFrom || !dateTo) return

    setStats(prev => ({ ...prev, loading: true }))

    const supabase = createClient()

    async function load() {
      // 1. Aggregate metrics_day in the date range
      const { data: metricsRows } = await supabase
        .from('metrics_day')
        .select('revenue, appointments, new_clients, no_shows, unique_contacts')
        .eq('org_uid', DEFAULT_ORG_UID)
        .gte('date', dateFrom)
        .lte('date', dateTo)

      let revenue = 0
      let appointments = 0
      let newClients = 0
      let noShows = 0
      let uniqueContacts = 0

      for (const row of metricsRows ?? []) {
        revenue += row.revenue ?? 0
        appointments += row.appointments ?? 0
        newClients += row.new_clients ?? 0
        noShows += row.no_shows ?? 0
        uniqueContacts += row.unique_contacts ?? 0
      }

      const avgCheck = appointments > 0 ? revenue / appointments : 0
      const savedTime = uniqueContacts * 4
      const conversionRate =
        uniqueContacts > 0 ? (appointments / uniqueContacts) * 100 : 0

      // 2. Returned clients from action_log
      const { count: returnedClients } = await supabase
        .from('action_log')
        .select('id', { count: 'exact', head: true })
        .eq('org_uid', DEFAULT_ORG_UID)
        .eq('action_code', 'vozvrat_klienta')
        .eq('status', 'успех')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)

      // 3. Pending confirmation count from appointments
      const { count: pendingConfirmation } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('org_uid', DEFAULT_ORG_UID)
        .eq('status', 'not_confirmed')

      // 4. At-risk clients count
      const { count: atRiskCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('org_uid', DEFAULT_ORG_UID)
        .eq('lifecycle_status', 'at_risk')

      // 5. Cancellations in the date range
      const { count: cancellations } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('org_uid', DEFAULT_ORG_UID)
        .in('status', ['cancelled', 'отменена'])
        .gte('date', dateFrom)
        .lte('date', dateTo)

      const isEmpty =
        revenue === 0 &&
        appointments === 0 &&
        newClients === 0 &&
        noShows === 0

      setStats({
        revenue,
        appointments,
        newClients,
        noShows,
        avgCheck,
        savedTime,
        returnedClients: returnedClients ?? 0,
        conversionRate,
        pendingConfirmation: pendingConfirmation ?? 0,
        atRiskCount: atRiskCount ?? 0,
        cancellations: cancellations ?? 0,
        loading: false,
        isEmpty,
      })
    }

    load().catch(() => {
      setStats(prev => ({ ...prev, loading: false }))
    })
  }, [dateFrom, dateTo])

  return stats
}
