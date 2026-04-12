'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'

export interface Appointment {
  id: string
  client_name: string | null
  phone: string | null
  service_name: string | null
  master_name: string | null
  status: string | null
  contact: string | null
  date: string | null
  price: number | null
  record_id: string
  yc_id: string | null
}

export interface AppointmentStats {
  total: number
  confirmed: number
  pending: number
  cancelled: number
  noShow: number
}

export interface AppointmentFilters {
  status: string
  masterId: string
  source: string
  dateFrom: Date
  dateTo: Date
}

const AGENT_CONTACTS = ['telegram', 'whatsapp', 'max']

export function useAppointments(filters: AppointmentFilters) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    noShow: 0,
  })

  useEffect(() => {
    setLoading(true)

    const supabase = createClient()

    async function load() {
      const dateFromStr = filters.dateFrom.toISOString()
      const dateToStr = filters.dateTo.toISOString()

      let query = supabase
        .from('appointments')
        .select(
          'id, client_name, phone, service_name, master_name, status, contact, date, price, record_id, yc_id',
        )
        .eq('org_uid', DEFAULT_ORG_UID)
        .gte('date', dateFromStr)
        .lte('date', dateToStr)
        .order('date', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.source === 'agent') {
        query = query.in('contact', AGENT_CONTACTS)
      } else if (filters.source === 'manual') {
        query = query.or('contact.is.null,contact.eq.yclients')
      }

      const { data, error } = await query

      if (error) {
        console.error('useAppointments error:', error)
        setLoading(false)
        return
      }

      const rows = (data ?? []) as Appointment[]

      // Compute stats from full result set (pre-status filter for funnel correctness)
      const statsQuery = supabase
        .from('appointments')
        .select('status')
        .eq('org_uid', DEFAULT_ORG_UID)
        .gte('date', dateFromStr)
        .lte('date', dateToStr)

      const { data: allData } = await statsQuery
      const allRows = allData ?? []

      const computedStats: AppointmentStats = {
        total: allRows.length,
        confirmed: allRows.filter(
          (r) => r.status === 'confirmed' || r.status === 'visited',
        ).length,
        pending: allRows.filter((r) => r.status === 'not_confirmed').length,
        cancelled: allRows.filter((r) => r.status === 'cancelled').length,
        noShow: allRows.filter((r) => r.status === 'no_show').length,
      }

      setAppointments(rows)
      setStats(computedStats)
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.masterId,
    filters.source,
  ])

  return { appointments, loading, stats }
}
