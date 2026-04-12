'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'

export interface ActionLogEvent {
  id: string
  action_code: string
  params: Record<string, unknown> | null
  status: string
  error_message: string | null
  created_at: string
}

export function useActionLog() {
  const [events, setEvents] = useState<ActionLogEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      try {
        const { data } = await supabase
          .from('action_log')
          .select('id, action_code, params, status, error_message, created_at')
          .eq('org_uid', DEFAULT_ORG_UID)
          .order('created_at', { ascending: false })
          .limit(50)
        setEvents((data as ActionLogEvent[]) ?? [])
      } catch {
        // Fall back to empty
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { events, loading }
}
