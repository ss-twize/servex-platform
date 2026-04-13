'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'
import { useOrgSettings, OrgSettings } from '@/lib/hooks/useOrgSettings'

export type ClientStatus = 'new' | 'active' | 'at_risk' | 'lost' | 'vip'

export interface Client {
  id: string
  fullname: string
  phone: string | null
  visits: number
  spent: number
  avg_check: number
  last_visit: string | null
  first_visit: string | null
  master: string | null
  source_channel: string | null
  can_message: boolean
  lifecycle_status: string
  clientStatus: ClientStatus
  daysAbsent: number
  telegram_user_id: number | null
  whatsapp_user_id: string | null
}

interface RawClient {
  id: string
  fullname: string
  phone: string | null
  visits: number
  spent: number
  avg_check: number
  last_visit: string | null
  first_visit: string | null
  master: string | null
  source_channel: string | null
  can_message: boolean
  lifecycle_status: string
  telegram_user_id: number | null
  whatsapp_user_id: string | null
}

export interface ClientFilters {
  segment: string
  master: string
  source: string
  canMessage: string
  minVisits: string
  maxVisits: string
  minRevenue: string
  maxRevenue: string
}

export interface ClientSegmentCounts {
  total: number
  new: number
  active: number
  at_risk: number
  lost: number
  vip: number
  can_message: number
}

function computeClientStatus(client: RawClient, settings: OrgSettings): ClientStatus {
  const daysSinceLastVisit = client.last_visit
    ? Math.floor((Date.now() - new Date(client.last_visit).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  if (client.visits >= settings.vip_visits_threshold || client.spent >= settings.vip_revenue_threshold) {
    return 'vip'
  }
  if (daysSinceLastVisit > settings.inactive_threshold_days) return 'lost'
  if (daysSinceLastVisit > settings.at_risk_threshold_days) return 'at_risk'
  if (daysSinceLastVisit > settings.active_threshold_days) return 'at_risk'
  if (!client.last_visit || !client.first_visit) return 'new'
  const daysSinceFirstVisit = Math.floor(
    (Date.now() - new Date(client.first_visit).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysSinceFirstVisit <= 30) return 'new'
  return 'active'
}

function computeDaysAbsent(client: RawClient): number {
  if (!client.last_visit) return 999
  return Math.floor((Date.now() - new Date(client.last_visit).getTime()) / (1000 * 60 * 60 * 24))
}

export function useClients(filters: ClientFilters) {
  const [rawClients, setRawClients] = useState<RawClient[]>([])
  const [loading, setLoading] = useState(true)
  const { settings, loading: settingsLoading } = useOrgSettings()

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('clients')
          .select('id, fullname, phone, visits, spent, avg_check, last_visit, first_visit, master, source_channel, can_message, lifecycle_status, telegram_user_id, whatsapp_user_id')
          .eq('org_uid', DEFAULT_ORG_UID)
          .order('last_visit', { ascending: false, nullsFirst: false })

        setRawClients((data as RawClient[]) ?? [])
      } catch {
        setRawClients([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const enriched = useMemo<Client[]>(() => {
    if (settingsLoading) return []
    return rawClients.map((c) => ({
      ...c,
      clientStatus: computeClientStatus(c, settings),
      daysAbsent: computeDaysAbsent(c),
    }))
  }, [rawClients, settings, settingsLoading])

  const segmentCounts = useMemo<ClientSegmentCounts>(() => {
    return {
      total: enriched.length,
      new: enriched.filter((c) => c.clientStatus === 'new').length,
      active: enriched.filter((c) => c.clientStatus === 'active').length,
      at_risk: enriched.filter((c) => c.clientStatus === 'at_risk').length,
      lost: enriched.filter((c) => c.clientStatus === 'lost').length,
      vip: enriched.filter((c) => c.clientStatus === 'vip').length,
      can_message: enriched.filter((c) => c.can_message).length,
    }
  }, [enriched])

  const clients = useMemo<Client[]>(() => {
    let result = enriched

    // Segment filter
    if (filters.segment === 'can_message') {
      result = result.filter((c) => c.can_message)
    } else if (filters.segment === 'no_message') {
      result = result.filter((c) => !c.can_message)
    } else if (filters.segment) {
      result = result.filter((c) => c.clientStatus === filters.segment)
    }

    // Source filter
    if (filters.source) {
      result = result.filter((c) => c.source_channel === filters.source)
    }

    // Can message filter
    if (filters.canMessage === 'yes') {
      result = result.filter((c) => c.can_message)
    } else if (filters.canMessage === 'no') {
      result = result.filter((c) => !c.can_message)
    }

    // Master filter
    if (filters.master) {
      result = result.filter((c) => c.master === filters.master)
    }

    // Visits range
    if (filters.minVisits !== '') {
      const min = parseInt(filters.minVisits, 10)
      if (!isNaN(min)) result = result.filter((c) => c.visits >= min)
    }
    if (filters.maxVisits !== '') {
      const max = parseInt(filters.maxVisits, 10)
      if (!isNaN(max)) result = result.filter((c) => c.visits <= max)
    }

    // Revenue range
    if (filters.minRevenue !== '') {
      const min = parseInt(filters.minRevenue, 10)
      if (!isNaN(min)) result = result.filter((c) => c.spent >= min)
    }
    if (filters.maxRevenue !== '') {
      const max = parseInt(filters.maxRevenue, 10)
      if (!isNaN(max)) result = result.filter((c) => c.spent <= max)
    }

    return result
  }, [enriched, filters])

  return { clients, loading: loading || settingsLoading, segmentCounts, settings }
}
