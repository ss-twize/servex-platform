import { createAdminClient } from '@/lib/supabase/admin'

const PARTNER_TOKEN = process.env.YCLIENTS_PARTNER_TOKEN ?? ''
const YCLIENTS_ACTIVATE_URL = 'https://api.yclients.com/api/v1/user/app/activation'

/**
 * Verify HMAC-SHA256 signature from YClients marketplace callback.
 * sign = HMAC-SHA256(userData, PARTNER_TOKEN) in hex
 */
export async function verifyUserDataSign(userData: string, sign: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(PARTNER_TOKEN),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(userData))
    const hex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return hex === sign
  } catch {
    return false
  }
}

/**
 * Decode base64-encoded user_data JSON from YClients marketplace.
 */
export function decodeUserData(userData: string): {
  name?: string
  email?: string
  phone?: string
  salon_name?: string
} {
  try {
    const json = Buffer.from(userData, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return {}
  }
}

/**
 * Attempt to activate the integration via YClients API.
 * Non-blocking — if the endpoint is unavailable, we still mark the integration active
 * since receiving salon_id in the callback already confirms user authorization.
 */
export async function activateIntegration(
  salonId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(YCLIENTS_ACTIVATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.api.v2+json',
        Authorization: `Bearer ${PARTNER_TOKEN}`,
      },
      body: JSON.stringify({ salon_id: Number(salonId) }),
    })

    // 404 means the endpoint doesn't exist for this app type — treat as success
    // since the callback itself is proof of user authorization
    if (res.status === 404 || res.ok) {
      return { success: true }
    }

    const text = await res.text().catch(() => res.statusText)
    return { success: false, error: `YClients API error ${res.status}: ${text}` }
  } catch (err) {
    // Network error — treat as success, authorization already happened
    console.warn('[activateIntegration] error (non-blocking):', err)
    return { success: true }
  }
}

/**
 * Insert a sync job and trigger sync via our own API route.
 * Fire-and-forget — never throws.
 *
 * Set YCLIENTS_SYNC_WEBHOOK_URL=https://servex-platform.vercel.app/api/yclients/sync
 * in Vercel env vars to enable automatic sync after connection.
 */
export async function triggerInitialSync(
  integrationId: string,
  salonId: string,
  orgUid: string
): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data: job } = await admin
      .from('yclients_sync_jobs')
      .insert({
        integration_id: integrationId,
        job_type: 'initial',
        status: 'pending',
      })
      .select('id')
      .single()

    const syncUrl = process.env.YCLIENTS_SYNC_WEBHOOK_URL
    if (syncUrl) {
      fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_id: integrationId,
          salon_id: salonId,
          org_uid: orgUid,
          job_id: job?.id,
        }),
      }).catch(() => {})
    }
  } catch {
    // never throw
  }
}
