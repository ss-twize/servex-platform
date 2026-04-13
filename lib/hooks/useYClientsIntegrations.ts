'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'

export interface YClientsIntegration {
  id: string
  org_uid: string
  salon_id: string
  salon_name: string | null
  status: 'pending_activation' | 'activation_failed' | 'active' | 'syncing' | 'degraded' | 'disconnected'
  connected_at: string | null
  disconnected_at: string | null
  last_sync_at: string | null
  last_webhook_at: string | null
  sync_error: string | null
  source: string | null
  created_at: string
  updated_at: string
}

const PENDING_STATUSES: YClientsIntegration['status'][] = ['pending_activation', 'syncing']

export function useYClientsIntegrations() {
  const [integrations, setIntegrations] = useState<YClientsIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchIntegrations = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('yclients_integrations')
      .select('*')
      .eq('org_uid', DEFAULT_ORG_UID)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setIntegrations(data as YClientsIntegration[])
    }
    setLoading(false)
    return data as YClientsIntegration[] | null
  }, [])

  // Polling when any integration is in a transient state
  const schedulePolling = useCallback(
    (data: YClientsIntegration[] | null) => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
        pollingRef.current = null
      }

      const hasPending = data?.some((i) => PENDING_STATUSES.includes(i.status))
      if (hasPending) {
        pollingRef.current = setTimeout(async () => {
          const fresh = await fetchIntegrations()
          schedulePolling(fresh)
        }, 5000)
      }
    },
    [fetchIntegrations]
  )

  const refetch = useCallback(async () => {
    const data = await fetchIntegrations()
    schedulePolling(data)
  }, [fetchIntegrations, schedulePolling])

  useEffect(() => {
    refetch()
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [refetch])

  return { integrations, loading, refetch }
}
