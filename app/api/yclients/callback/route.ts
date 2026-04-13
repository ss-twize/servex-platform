import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ORG_UID } from '@/lib/constants'
import {
  verifyUserDataSign,
  decodeUserData,
  activateIntegration,
  triggerInitialSync,
} from '@/lib/yclients-integration'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // 1. Parse params
  const salonIdParam = searchParams.get('salon_id')
  const salonIdsArray = searchParams.getAll('salon_ids[]')
  const userData = searchParams.get('user_data')
  const userDataSign = searchParams.get('user_data_sign')

  // 2. Collect all salon IDs
  const salonIds: string[] = []
  if (salonIdParam) salonIds.push(salonIdParam)
  salonIdsArray.forEach((id) => { if (id && !salonIds.includes(id)) salonIds.push(id) })

  if (salonIds.length === 0) {
    return NextResponse.redirect(
      new URL('/settings?tab=integrations&error=no_salon_id', request.url)
    )
  }

  // 3. Check authentication
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const returnUrl = `/api/yclients/callback?${searchParams.toString()}`
    return NextResponse.redirect(
      new URL(`/login?return=${encodeURIComponent(returnUrl)}`, request.url)
    )
  }

  // 4. Org UID (MVP: single org)
  const orgUid = DEFAULT_ORG_UID

  // 5. Verify signature (log warning but continue)
  if (userData && userDataSign) {
    const valid = await verifyUserDataSign(userData, userDataSign)
    if (!valid) {
      console.warn('[yclients/callback] Invalid user_data_sign — continuing anyway')
    }
  }

  // 6. Decode user_data
  const decodedUser = userData ? decodeUserData(userData) : {}

  const admin = createAdminClient()

  let successCount = 0

  // 7. Process each salon
  for (const salonId of salonIds) {
    // a. Create attempt record
    const { data: attemptRow } = await admin
      .from('yclients_integration_attempts')
      .insert({
        org_uid: orgUid,
        salon_id: salonId,
        flow_type: 'signup',
      })
      .select('id')
      .single()

    const attemptId: string = attemptRow?.id ?? ''

    // b. Upsert integration with pending_activation
    const { data: integrationRow } = await admin
      .from('yclients_integrations')
      .upsert(
        {
          org_uid: orgUid,
          salon_id: salonId,
          salon_name: decodedUser.salon_name ?? null,
          status: 'pending_activation',
          raw_user_data: decodedUser ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_uid,salon_id' }
      )
      .select('id')
      .single()

    const integrationId: string = integrationRow?.id ?? ''

    // c. Update attempt: activate_started_at
    if (attemptId) {
      await admin
        .from('yclients_integration_attempts')
        .update({ activate_started_at: new Date().toISOString() })
        .eq('id', attemptId)
    }

    // d. Call activation API
    const result = await activateIntegration(salonId)

    if (result.success) {
      // e. Update integration status to active
      await admin
        .from('yclients_integrations')
        .update({
          status: 'active',
          connected_at: new Date().toISOString(),
          sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)

      // Update attempt result
      if (attemptId) {
        await admin
          .from('yclients_integration_attempts')
          .update({
            activate_finished_at: new Date().toISOString(),
            result: 'success',
          })
          .eq('id', attemptId)
      }

      // g. Trigger initial sync (fire & forget)
      triggerInitialSync(integrationId, salonId, orgUid)

      successCount++
    } else {
      // f. Update integration status to activation_failed
      await admin
        .from('yclients_integrations')
        .update({
          status: 'activation_failed',
          sync_error: result.error ?? 'unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)

      if (attemptId) {
        await admin
          .from('yclients_integration_attempts')
          .update({
            activate_finished_at: new Date().toISOString(),
            result: 'error',
            error_message: result.error ?? 'unknown error',
          })
          .eq('id', attemptId)
      }
    }
  }

  // 8. Update org_settings if at least one salon connected
  if (successCount > 0) {
    await admin
      .from('org_settings')
      .update({ yclients_connected: true, updated_at: new Date().toISOString() })
      .eq('org_uid', orgUid)

    return NextResponse.redirect(
      new URL('/settings?tab=integrations&connected=true', request.url)
    )
  } else {
    return NextResponse.redirect(
      new URL('/settings?tab=integrations&error=activation_failed', request.url)
    )
  }
}
