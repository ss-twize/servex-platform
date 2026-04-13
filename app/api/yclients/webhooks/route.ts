import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // Always return 200 — YClients treats any HTTP response as successful delivery
  let body: Record<string, unknown> = {}

  try {
    body = await request.json()
  } catch {
    // Parse error — still return 200
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const salonId = String(body.company_id ?? '')
  const resource = String(body.resource ?? '')
  const resourceId = String(body.resource_id ?? '')
  const status = String(body.status ?? '')
  const dedupeKey = `${resource}_${resourceId}_${status}_${Date.now()}`

  const admin = createAdminClient()

  // Insert webhook event (ignore conflicts on dedupe_key)
  await admin.from('yclients_webhook_events').insert({
    salon_id: salonId || null,
    resource: resource || null,
    resource_id: resourceId || null,
    status: status || null,
    payload_json: body,
    dedupe_key: dedupeKey,
  })

  // Update last_webhook_at for this salon
  if (salonId) {
    await admin
      .from('yclients_integrations')
      .update({
        last_webhook_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('salon_id', salonId)

    // Special case: app disconnect/delete
    if (resource === 'app' && (status === 'delete' || status === 'disconnect')) {
      await admin
        .from('yclients_integrations')
        .update({
          status: 'disconnected',
          disconnected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('salon_id', salonId)
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
