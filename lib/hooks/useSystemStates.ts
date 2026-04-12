'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'
import { callWebhook } from '@/lib/webhooks'

export interface SystemState {
  id: string
  system_code: string
  name: string
  description: string | null
  enabled: boolean
  updated_at: string
}

export function useSystemStates() {
  const [states, setStates] = useState<SystemState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      try {
        const { data } = await supabase
          .from('system_states')
          .select('*')
          .eq('org_uid', DEFAULT_ORG_UID)
          .order('name')
        setStates((data as SystemState[]) ?? [])
      } catch {
        // Fall back to empty
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const toggleState = useCallback(async (code: string, enabled: boolean) => {
    const supabase = createClient()

    // Optimistic update
    setStates(prev =>
      prev.map(s =>
        s.system_code === code ? { ...s, enabled, updated_at: new Date().toISOString() } : s
      )
    )

    await supabase
      .from('system_states')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('org_uid', DEFAULT_ORG_UID)
      .eq('system_code', code)

    await callWebhook(`toggle_${code}`, { enabled })
  }, [])

  return { states, loading, toggleState }
}
