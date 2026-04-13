import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerInitialSync } from '@/lib/yclients-integration'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { integration_id, salon_id, org_uid } = body

    if (!integration_id || !salon_id || !org_uid) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Update integration status to syncing
    const admin = createAdminClient()
    await admin
      .from('yclients_integrations')
      .update({ status: 'syncing', updated_at: new Date().toISOString() })
      .eq('id', integration_id)

    // Trigger sync job (fire & forget)
    triggerInitialSync(integration_id, salon_id, org_uid)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
