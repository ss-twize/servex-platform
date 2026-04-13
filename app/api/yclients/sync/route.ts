import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ORG_UID } from '@/lib/constants'

const PARTNER_TOKEN = process.env.YCLIENTS_PARTNER_TOKEN ?? ''
const USER_TOKEN = process.env.YCLIENTS_USER_TOKEN ?? ''
const BASE_URL = 'https://api.yclients.com/api/v1'

function ycHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.api.v2+json',
    Authorization: `Bearer ${PARTNER_TOKEN}, User ${USER_TOKEN}`,
  }
}

// --- YClients API fetch helpers ---

interface YCClient {
  id: number
  name: string
  surname?: string
  patronymic?: string
  display_name?: string
  phone: string
  email: string | null
  visits: number
  spent: number
  paid: number
  balance: number
  discount: number
  birth_date: string | null
  sex_id: number
  comment: string | null
  sms_check?: number
  sms_bot?: number
  sms_not?: number
  importance_id?: number
  importance?: string
  last_change_date?: string
  categories: { id: number; title: string }[]
  custom_fields: Record<string, unknown>
}

interface YCRecord {
  id: number
  staff_id: number
  date: string
  datetime: string
  seance_length: number
  client: { id: number; name: string; phone: string }
  services: { id: number; title: string; cost: number }[]
  staff: { id: number; name: string }
  attendance: number
  confirmed: number
  paid_full: number
  comment: string | null
}

async function fetchClients(salonId: string, page: number): Promise<YCClient[]> {
  const res = await fetch(
    `${BASE_URL}/clients/${salonId}?page=${page}&count=200`,
    { headers: ycHeaders(), cache: 'no-store' }
  )
  if (!res.ok) return []
  const json = await res.json()
  return Array.isArray(json.data) ? json.data : []
}

async function fetchRecords(salonId: string, page: number, startDate: string, endDate: string): Promise<YCRecord[]> {
  const qs = new URLSearchParams({
    page: String(page),
    count: '200',
    start_date: startDate,
    end_date: endDate,
  })
  const res = await fetch(
    `${BASE_URL}/records/${salonId}?${qs}`,
    { headers: ycHeaders(), cache: 'no-store' }
  )
  if (!res.ok) return []
  const json = await res.json()
  return Array.isArray(json.data) ? json.data : []
}

// --- Transform helpers ---

function clientToRow(c: YCClient, orgUid: string) {
  const sexMap: Record<number, string> = { 1: 'мужской', 2: 'женский' }
  const visits = c.visits ?? 0
  const spent = c.spent ?? 0
  return {
    org_uid: orgUid,
    yc_id: String(c.id),
    yclients_id: c.id,
    fullname: c.name || 'Без имени',
    name: c.name || null,
    surname: c.surname || null,
    patronymic: c.patronymic || null,
    display_name: c.display_name || null,
    phone: c.phone || null,
    email: c.email || null,
    lifecycle_status: visits > 0 ? 'client' : 'lead',
    source_channel: 'yclients',
    discount: c.discount ?? 0,
    visits,
    spent,
    paid: c.paid ?? 0,
    balance: c.balance ?? 0,
    avg_check: visits > 0 ? Math.round(spent / visits) : 0,
    birth_date: c.birth_date || null,
    sex_id: c.sex_id ?? 0,
    sex: sexMap[c.sex_id] ?? null,
    comment: c.comment || null,
    sms_check: c.sms_check ?? 0,
    sms_bot: c.sms_bot ?? 0,
    sms_not: c.sms_not ?? 0,
    importance_id: c.importance_id ?? 0,
    importance: c.importance || null,
    categories: c.categories ?? [],
    custom_fields: c.custom_fields ?? {},
    last_change_date: c.last_change_date || null,
    raw_payload: c,
    updated_at: new Date().toISOString(),
  }
}

function recordToRow(r: YCRecord, orgUid: string) {
  const service = r.services?.[0]
  const attendance = r.attendance ?? 0
  const confirmed = r.confirmed ?? 0
  let status: string
  if (attendance === 1) status = 'Визит'
  else if (attendance === -1) status = 'Неявка'
  else if (confirmed === 1) status = 'Подтверждено'
  else status = 'Ожидание'

  return {
    org_uid: orgUid,
    yc_id: String(r.id),
    record_id: String(r.id),
    record_hash: `${r.id}_${r.date}`,
    client_name: r.client?.name ?? null,
    phone: r.client?.phone ?? null,
    status,
    service_name: service?.title ?? null,
    service_id: service ? String(service.id) : null,
    master_id: r.staff_id ? String(r.staff_id) : null,
    master_name: r.staff?.name ?? null,
    date: r.datetime || r.date || null,
    duration_min: r.seance_length ? Math.round(r.seance_length / 60) : null,
    price: service?.cost ?? null,
    comment: r.comment ?? null,
  }
}

// --- Main sync function ---

async function runSync(salonId: string, integrationId: string, orgUid: string, jobId: string) {
  const admin = createAdminClient()

  // Mark job as running
  await admin
    .from('yclients_sync_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId)

  try {
    // === 1. Sync clients ===
    let clientPage = 1
    let totalClients = 0
    while (clientPage <= 10) { // max 2000 clients
      const clients = await fetchClients(salonId, clientPage)
      if (!clients.length) break

      const rows = clients.map((c) => clientToRow(c, orgUid))

      await admin
        .from('clients')
        .upsert(rows, { onConflict: 'org_uid,yc_id', ignoreDuplicates: false })

      totalClients += clients.length
      if (clients.length < 200) break
      clientPage++
    }

    // === 2. Sync records (appointments) ===
    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 90)
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + 30)

    const fmt = (d: Date) => d.toISOString().split('T')[0]

    let recordPage = 1
    let totalRecords = 0
    while (recordPage <= 10) { // max 2000 records
      const records = await fetchRecords(salonId, recordPage, fmt(startDate), fmt(endDate))
      if (!records.length) break

      const rows = records.map((r) => recordToRow(r, orgUid))

      await admin
        .from('appointments')
        .upsert(rows, { onConflict: 'record_id', ignoreDuplicates: false })

      totalRecords += records.length
      if (records.length < 200) break
      recordPage++
    }

    // === 3. Update integration ===
    await admin
      .from('yclients_integrations')
      .update({
        status: 'active',
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId)

    // === 4. Mark job done ===
    await admin
      .from('yclients_sync_jobs')
      .update({
        status: 'done',
        finished_at: new Date().toISOString(),
        error_message: `Клиентов: ${totalClients}, записей: ${totalRecords}`,
      })
      .eq('id', jobId)

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    await admin
      .from('yclients_integrations')
      .update({
        status: 'degraded',
        sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId)

    await admin
      .from('yclients_sync_jobs')
      .update({
        status: 'error',
        finished_at: new Date().toISOString(),
        error_message: message,
      })
      .eq('id', jobId)
  }
}

// --- Route handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { integration_id, salon_id, org_uid, job_id } = body

    if (!integration_id || !salon_id) {
      return NextResponse.json({ ok: false, error: 'Missing integration_id or salon_id' }, { status: 400 })
    }

    const resolvedOrgUid = org_uid ?? DEFAULT_ORG_UID
    const admin = createAdminClient()

    // Create or use existing sync job
    let jobId = job_id
    if (!jobId) {
      const { data } = await admin
        .from('yclients_sync_jobs')
        .insert({
          integration_id,
          job_type: 'initial',
          status: 'pending',
        })
        .select('id')
        .single()
      jobId = data?.id
    }

    // Update integration to syncing
    await admin
      .from('yclients_integrations')
      .update({ status: 'syncing', updated_at: new Date().toISOString() })
      .eq('id', integration_id)

    // Run sync (fire & forget — respond immediately, sync continues)
    runSync(salon_id, integration_id, resolvedOrgUid, jobId).catch(() => {})

    return NextResponse.json({ ok: true, job_id: jobId })
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
