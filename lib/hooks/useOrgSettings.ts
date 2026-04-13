'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'

export interface OrgSettings {
  org_uid: string
  salon_name: string
  greeting_message: string
  work_start: string
  work_end: string
  active_threshold_days: number
  at_risk_threshold_days: number
  inactive_threshold_days: number
  vip_visits_threshold: number
  vip_revenue_threshold: number
  timezone: string
  currency: string
  address: string | null
  phone: string | null
  map_url: string | null
  yclients_company_id: string | null
  yclients_connected: boolean
  telegram_connected: boolean
  telegram_bot_token: string | null
  telegram_bot_name: string | null
  telegram_bot_username: string | null
  whatsapp_connected: boolean
}

const DEFAULT_SETTINGS: OrgSettings = {
  org_uid: DEFAULT_ORG_UID,
  salon_name: 'Мой бизнес',
  greeting_message: 'Привет! Чем могу помочь?',
  work_start: '09:00',
  work_end: '21:00',
  active_threshold_days: 30,
  at_risk_threshold_days: 50,
  inactive_threshold_days: 90,
  vip_visits_threshold: 10,
  vip_revenue_threshold: 50000,
  timezone: 'Europe/Moscow',
  currency: 'RUB',
  address: null,
  phone: null,
  map_url: null,
  yclients_company_id: null,
  yclients_connected: false,
  telegram_connected: false,
  telegram_bot_token: null,
  telegram_bot_name: null,
  telegram_bot_username: null,
  whatsapp_connected: false,
}

export function useOrgSettings() {
  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      try {
        const { data } = await supabase
          .from('org_settings')
          .select('*')
          .eq('org_uid', DEFAULT_ORG_UID)
          .single()
        if (data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data } as OrgSettings)
        }
      } catch {
        // Fall back to defaults
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const updateSettings = useCallback(async (patch: Partial<OrgSettings>) => {
    const supabase = createClient()

    const updated = { ...settings, ...patch, org_uid: DEFAULT_ORG_UID }
    setSettings(updated)

    await supabase
      .from('org_settings')
      .upsert(updated, { onConflict: 'org_uid' })
  }, [settings])

  return { settings, loading, updateSettings }
}
