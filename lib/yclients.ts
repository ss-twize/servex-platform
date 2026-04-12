// Server-side only — do NOT import in client components or hooks
const PARTNER_TOKEN = process.env.YCLIENTS_PARTNER_TOKEN!
const USER_TOKEN = process.env.YCLIENTS_USER_TOKEN!
const COMPANY_ID = process.env.YCLIENTS_COMPANY_ID!
const BASE_URL = 'https://api.yclients.com/api/v1'

export interface YClientsAppointment {
  id: number
  date: string
  datetime: string
  client: { id: number; name: string; phone: string }
  services: Array<{ title: string; id: number }>
  staff: { id: number; name: string }
  status: { id: number; title: string }
  attendance: number
  paid_full: number
}

export interface YClientsClient {
  id: number
  name: string
  phone: string
  email: string
  visits: number
  spent: number
}

function yclientsHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${PARTNER_TOKEN}, User ${USER_TOKEN}`,
  }
}

async function yclientsFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: yclientsHeaders(),
    // Disable Next.js fetch cache for live data
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`YClients API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  // YClients wraps responses in { success, data }
  if (json.success === false) {
    throw new Error(`YClients API error: ${json.meta?.message ?? 'Unknown error'}`)
  }

  return json.data as T
}

export async function getAppointments(params: {
  dateFrom?: string
  dateTo?: string
  staffId?: number
  page?: number
  count?: number
} = {}): Promise<YClientsAppointment[]> {
  const { dateFrom, dateTo, staffId, page = 1, count = 200 } = params

  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('count', String(count))
  if (dateFrom) qs.set('start_date', dateFrom)
  if (dateTo) qs.set('end_date', dateTo)
  if (staffId) qs.set('staff_id', String(staffId))

  return yclientsFetch<YClientsAppointment[]>(
    `/records/${COMPANY_ID}?${qs.toString()}`
  )
}

export async function getClients(params: {
  page?: number
  count?: number
} = {}): Promise<YClientsClient[]> {
  const { page = 1, count = 200 } = params

  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('count', String(count))

  return yclientsFetch<YClientsClient[]>(
    `/clients/${COMPANY_ID}?${qs.toString()}`
  )
}
