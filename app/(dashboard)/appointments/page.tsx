'use client'

import React, { useState, useMemo } from 'react'
import { MetricCard } from '@/components/ui/MetricCard'
import { FilterBar, FilterConfig } from '@/components/ui/FilterBar'
import { Table } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SortableHeader } from '@/components/ui/SortableHeader'
import { AppointmentFunnel } from '@/components/appointments/AppointmentFunnel'
import { TimeHeatmap } from '@/components/appointments/TimeHeatmap'
import { useAppointments, AppointmentFilters, Appointment } from '@/lib/hooks/useAppointments'
import { usePeriod } from '@/lib/contexts/PeriodContext'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/constants'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`
}

const CONTACT_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  max: 'MAX',
  yclients: 'YClients',
}

const AGENT_CONTACTS = new Set(['telegram', 'whatsapp', 'max'])

function sourceLabel(contact: string | null): string {
  if (!contact) return 'Вручную'
  return CONTACT_LABELS[contact.toLowerCase()] ?? contact
}

function createdByLabel(contact: string | null): string {
  if (!contact) return 'Вручную'
  return AGENT_CONTACTS.has(contact.toLowerCase()) ? 'Агент' : 'Вручную'
}

type SortField = 'date' | 'client_name' | 'service_name' | 'master_name' | 'status'
type SortDir = 'asc' | 'desc'

function sortAppointments(
  list: Appointment[],
  field: SortField,
  dir: SortDir,
): Appointment[] {
  return [...list].sort((a, b) => {
    let valA: string | number | null = null
    let valB: string | number | null = null

    if (field === 'date') {
      valA = a.date ? new Date(a.date).getTime() : 0
      valB = b.date ? new Date(b.date).getTime() : 0
    } else {
      valA = (a[field] ?? '').toLowerCase()
      valB = (b[field] ?? '').toLowerCase()
    }

    if (valA === valB) return 0
    const cmp = valA < valB ? -1 : 1
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─── filter configs ──────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = Object.entries(APPOINTMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
)

const FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Статус',
    options: STATUS_FILTER_OPTIONS,
  },
  {
    key: 'source',
    label: 'Источник',
    options: [
      { value: 'agent', label: 'Агент' },
      { value: 'manual', label: 'Вручную' },
    ],
  },
]

// ─── page ────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { dateFrom, dateTo } = usePeriod()

  // Filter state
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: '',
    source: '',
  })

  // Sort state
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(field: string) {
    const f = field as SortField
    if (f === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(f)
      setSortDir('desc')
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
  }

  const filters: AppointmentFilters = useMemo(
    () => ({
      status: filterValues.status,
      masterId: '',
      source: filterValues.source,
      dateFrom,
      dateTo,
    }),
    [filterValues.status, filterValues.source, dateFrom, dateTo],
  )

  const { appointments, loading, stats } = useAppointments(filters)

  const sorted = useMemo(
    () => sortAppointments(appointments, sortField, sortDir),
    [appointments, sortField, sortDir],
  )

  // Table headers
  const headers = [
    <SortableHeader
      key="date"
      label="Дата и время"
      field="date"
      sortField={sortField}
      sortDir={sortDir}
      onSort={handleSort}
    />,
    <SortableHeader
      key="client_name"
      label="Клиент"
      field="client_name"
      sortField={sortField}
      sortDir={sortDir}
      onSort={handleSort}
    />,
    <SortableHeader
      key="service_name"
      label="Услуга"
      field="service_name"
      sortField={sortField}
      sortDir={sortDir}
      onSort={handleSort}
    />,
    <SortableHeader
      key="master_name"
      label="Мастер"
      field="master_name"
      sortField={sortField}
      sortDir={sortDir}
      onSort={handleSort}
    />,
    <SortableHeader
      key="status"
      label="Статус"
      field="status"
      sortField={sortField}
      sortDir={sortDir}
      onSort={handleSort}
    />,
    'Источник',
    'Кто создал',
  ]

  const rows: React.ReactNode[][] = sorted.map((appt) => {
    const statusLabel =
      appt.status ? (APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status) : '—'

    return [
      <span key="date" className="text-[#8299B4] font-mono text-xs">
        {formatDate(appt.date)}
      </span>,
      <span key="client" className="font-medium text-[#EDF2FA]">
        {appt.client_name ?? '—'}
      </span>,
      <span key="service" className="text-[#8299B4]">
        {appt.service_name ?? '—'}
      </span>,
      <span key="master" className="text-[#8299B4]">
        {appt.master_name ?? '—'}
      </span>,
      <StatusBadge key="status" status={statusLabel} variant="appointment" />,
      <span key="source" className="text-[#8299B4] text-xs">
        {sourceLabel(appt.contact)}
      </span>,
      <span
        key="created_by"
        className={[
          'text-xs font-medium px-2 py-0.5 rounded-full',
          AGENT_CONTACTS.has((appt.contact ?? '').toLowerCase())
            ? 'bg-[#00FF00]/10 text-[#00FF00]'
            : 'bg-[#223444]/50 text-[#8299B4]',
        ].join(' ')}
      >
        {createdByLabel(appt.contact)}
      </span>,
    ]
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page title */}
      <h1 className="font-unbounded text-xl text-[#EDF2FA]">Записи</h1>

      {/* Block 1: Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          title="Всего записей"
          value={loading ? undefined : stats.total}
          isEmpty={!loading && stats.total === 0}
        />
        <MetricCard
          title="Подтверждено"
          value={loading ? undefined : stats.confirmed}
          isEmpty={!loading && stats.total === 0}
        />
        <MetricCard
          title="Ожидает"
          value={loading ? undefined : stats.pending}
          isEmpty={!loading && stats.total === 0}
        />
        <MetricCard
          title="Отменено"
          value={loading ? undefined : stats.cancelled}
          isEmpty={!loading && stats.total === 0}
        />
        <MetricCard
          title="Неявки"
          value={loading ? undefined : stats.noShow}
          isEmpty={!loading && stats.total === 0}
        />
      </div>

      {/* Block 2: Funnel + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AppointmentFunnel stats={stats} loading={loading} />
        <TimeHeatmap appointments={appointments} loading={loading} />
      </div>

      {/* Block 3: Filters */}
      <FilterBar
        filters={FILTERS}
        values={filterValues}
        onChange={handleFilterChange}
      />

      {/* Block 4: Table */}
      <Table
        headers={headers}
        rows={rows}
        isEmpty={!loading && appointments.length === 0}
        emptyMessage="Нет записей за выбранный период"
        loading={loading}
      />
    </div>
  )
}
