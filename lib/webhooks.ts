import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'

// 30-second URL cache
const urlCache = new Map<string, { url: string; expiresAt: number }>()
let cachePopulatedAt = 0

async function getUrl(actionCode: string): Promise<string | null> {
  const now = Date.now()

  // Refresh full cache if older than 30s
  if (now - cachePopulatedAt > 30_000) {
    const supabase = createClient()
    const { data } = await supabase
      .from('webhooks')
      .select('action_code, url')
      .eq('org_uid', DEFAULT_ORG_UID)
      .eq('enabled', true)

    urlCache.clear()
    if (data) {
      for (const row of data) {
        urlCache.set(row.action_code, { url: row.url, expiresAt: now + 30_000 })
      }
    }
    cachePopulatedAt = now
  }

  const cached = urlCache.get(actionCode)
  if (cached && cached.expiresAt > Date.now()) return cached.url

  return null
}

async function logAction(
  actionCode: string,
  params: Record<string, unknown>,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.from('action_log').insert({
      org_uid: DEFAULT_ORG_UID,
      action_code: actionCode,
      params,
      status,
      error_message: errorMessage ?? null,
    })
  } catch {
    // Silent — logging must never throw
  }
}

export async function callWebhook(
  actionCode: string,
  params: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string }> {
  const url = await getUrl(actionCode)

  if (!url) {
    await logAction(actionCode, params, 'ошибка', 'Webhook URL не найден')
    return { success: false, error: 'Webhook URL не найден' }
  }

  const payload = {
    org_uid: DEFAULT_ORG_UID,
    action_code: actionCode,
    params,
    client_time: new Date().toISOString(),
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      await logAction(actionCode, params, 'успех')
      return { success: true }
    } else {
      const errMsg = `HTTP ${res.status}`
      await logAction(actionCode, params, 'ошибка', errMsg)
      return { success: false, error: errMsg }
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err)
    await logAction(actionCode, params, 'ошибка', errMsg)
    return { success: false, error: errMsg }
  }
}

export function invalidateWebhookCache(): void {
  urlCache.clear()
  cachePopulatedAt = 0
}
