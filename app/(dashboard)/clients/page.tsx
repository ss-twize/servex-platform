'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { MetricCard } from '@/components/ui/MetricCard'
import { FilterBar, FilterConfig } from '@/components/ui/FilterBar'
import { Table } from '@/components/ui/Table'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SortableHeader } from '@/components/ui/SortableHeader'
import { SegmentTabs } from '@/components/clients/SegmentTabs'
import { BulkActionBar } from '@/components/clients/BulkActionBar'
import { useClients, Client, ClientFilters } from '@/lib/hooks/useClients'
import { callWebhook } from '@/lib/webhooks'
import { DEFAULT_ORG_UID } from '@/lib/constants'

type SortDir = 'asc' | 'desc'

const SOURCE_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  yclients: 'Yclients',
  manual: 'Вручную',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU') + ' ₽'
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'source',
    label: 'Источник',
    options: [
      { value: 'telegram', label: 'Telegram' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'yclients', label: 'Yclients' },
      { value: 'manual', label: 'Вручную' },
    ],
  },
  {
    key: 'canMessage',
    label: 'Можно писать',
    options: [
      { value: 'yes', label: 'Да' },
      { value: 'no', label: 'Нет' },
    ],
  },
]

const DEFAULT_FILTERS: ClientFilters = {
  segment: '',
  master: '',
  source: '',
  canMessage: '',
  minVisits: '',
  maxVisits: '',
  minRevenue: '',
  maxRevenue: '',
}

export default function ClientsPage() {
  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_FILTERS)
  const [sortField, setSortField] = useState('last_visit')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const { clients, loading, segmentCounts, settings } = useClients(filters)

  // Sorting
  const sorted = useMemo<Client[]>(() => {
    if (!sortField) return clients
    return [...clients].sort((a, b) => {
      let av: string | number | null = null
      let bv: string | number | null = null

      switch (sortField) {
        case 'fullname': av = a.fullname; bv = b.fullname; break
        case 'visits': av = a.visits; bv = b.visits; break
        case 'spent': av = a.spent; bv = b.spent; break
        case 'avg_check': av = a.avg_check; bv = b.avg_check; break
        case 'daysAbsent': av = a.daysAbsent; bv = b.daysAbsent; break
        case 'last_visit':
          av = a.last_visit ?? ''
          bv = b.last_visit ?? ''
          break
        default: return 0
      }

      if (av === null || av === '') return sortDir === 'asc' ? -1 : 1
      if (bv === null || bv === '') return sortDir === 'asc' ? 1 : -1

      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }

      const cmp = String(av).localeCompare(String(bv), 'ru')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [clients, sortField, sortDir])

  const handleSort = useCallback((field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('desc')
      return field
    })
  }, [])

  // Filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setSelectedIds([])
  }, [])

  const handleSegmentChange = useCallback((segment: string) => {
    setFilters((prev) => ({ ...prev, segment }))
    setSelectedIds([])
  }, [])

  // Row selection
  const allVisibleIds = sorted.map((c) => c.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allVisibleIds)
    }
  }, [allSelected, allVisibleIds])

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  // Bulk actions
  const handleBulkAction = useCallback(async (action: string, ids: string[]) => {
    const result = await callWebhook(action, { client_ids: ids, org_uid: DEFAULT_ORG_UID })
    if (result.success) {
      setToast('Действие успешно запущено')
    } else {
      setToast('Ошибка: ' + (result.error ?? 'неизвестная ошибка'))
    }
    setSelectedIds([])
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Table headers
  const headers = [
    <input
      key="select-all"
      type="checkbox"
      checked={allSelected}
      onChange={toggleSelectAll}
      className="rounded border-[#223444] bg-[#0F1622] accent-[#00FF00] cursor-pointer w-4 h-4"
      aria-label="Выбрать все"
    />,
    <SortableHeader key="fullname" label="Имя" field="fullname" sortField={sortField} sortDir={sortDir} onSort={handleSort} />,
    'Телефон',
    'Статус',
    <SortableHeader key="last_visit" label="Последний визит" field="last_visit" sortField={sortField} sortDir={sortDir} onSort={handleSort} />,
    <SortableHeader key="daysAbsent" label="Дней без визита" field="daysAbsent" sortField={sortField} sortDir={sortDir} onSort={handleSort} />,
    <SortableHeader key="visits" label="Визитов" field="visits" sortField={sortField} sortDir={sortDir} onSort={handleSort} />,
    <SortableHeader key="spent" label="Выручка" field="spent" sortField={sortField} sortDir={sortDir} onSort={handleSort} />,
    <SortableHeader key="avg_check" label="Ср. чек" field="avg_check" sortField={sortField} sortDir={sortDir} onSort={handleSort} />,
    'Мастер',
    'Канал',
    'Согласие',
  ]

  // Table rows
  const rows = sorted.map((client) => {
    const isSelected = selectedIds.includes(client.id)
    const daysRed = client.daysAbsent > settings.at_risk_threshold_days

    return [
      <input
        key={`chk-${client.id}`}
        type="checkbox"
        checked={isSelected}
        onChange={() => toggleSelectOne(client.id)}
        className="rounded border-[#223444] bg-[#0F1622] accent-[#00FF00] cursor-pointer w-4 h-4"
        aria-label={`Выбрать ${client.fullname}`}
      />,
      <span key="name" className="font-medium text-[#EDF2FA]">{client.fullname || '—'}</span>,
      <span key="phone" className="text-[#8299B4]">{client.phone ?? '—'}</span>,
      <StatusBadge key="status" status={client.clientStatus} variant="client" />,
      <span key="lv" className="text-[#8299B4]">{formatDate(client.last_visit)}</span>,
      <span key="days" className={daysRed ? 'text-red-400 font-medium' : 'text-[#EDF2FA]'}>
        {client.daysAbsent === 999 ? '—' : client.daysAbsent}
      </span>,
      <span key="visits">{client.visits}</span>,
      <span key="spent">{formatMoney(client.spent)}</span>,
      <span key="avg">{formatMoney(client.avg_check)}</span>,
      <span key="master" className="text-[#8299B4]">{client.master ?? '—'}</span>,
      <span key="channel" className="text-[#8299B4]">
        {client.source_channel ? (SOURCE_LABELS[client.source_channel] ?? client.source_channel) : '—'}
      </span>,
      <span key="consent" className={client.can_message ? 'text-[#00FF00]' : 'text-red-400'}>
        {client.can_message ? '✓' : '✗'}
      </span>,
    ]
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#0F1622] border border-[#00FF00] text-[#EDF2FA] text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-unbounded text-[#EDF2FA]">Клиенты</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Всего клиентов"
          value={loading ? undefined : segmentCounts.total}
          isEmpty={!loading && segmentCounts.total === 0}
        />
        <MetricCard
          title="Новые"
          value={loading ? undefined : segmentCounts.new}
          isEmpty={!loading && segmentCounts.total === 0}
        />
        <MetricCard
          title="Активные"
          value={loading ? undefined : segmentCounts.active}
          isEmpty={!loading && segmentCounts.total === 0}
        />
        <MetricCard
          title="Под риском"
          value={loading ? undefined : segmentCounts.at_risk}
          isEmpty={!loading && segmentCounts.total === 0}
          subtitle="требуют внимания"
        />
        <MetricCard
          title="Потерянные"
          value={loading ? undefined : segmentCounts.lost}
          isEmpty={!loading && segmentCounts.total === 0}
          subtitle="давно не приходили"
        />
      </div>

      {/* Segment Tabs */}
      <SegmentTabs
        counts={segmentCounts}
        activeSegment={filters.segment}
        onChange={handleSegmentChange}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <FilterBar
          filters={FILTER_CONFIGS}
          values={{ source: filters.source, canMessage: filters.canMessage }}
          onChange={handleFilterChange}
        />

        {/* Range inputs */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase tracking-wide text-[#5E7488] px-1">Визитов от</label>
          <input
            type="number"
            min="0"
            value={filters.minVisits}
            onChange={(e) => handleFilterChange('minVisits', e.target.value)}
            placeholder="—"
            className="bg-[#0F1622] border border-[#223444] text-[#EDF2FA] rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-[#00FF00] hover:border-[#8299B4] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase tracking-wide text-[#5E7488] px-1">Визитов до</label>
          <input
            type="number"
            min="0"
            value={filters.maxVisits}
            onChange={(e) => handleFilterChange('maxVisits', e.target.value)}
            placeholder="—"
            className="bg-[#0F1622] border border-[#223444] text-[#EDF2FA] rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:border-[#00FF00] hover:border-[#8299B4] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase tracking-wide text-[#5E7488] px-1">Выручка от, ₽</label>
          <input
            type="number"
            min="0"
            value={filters.minRevenue}
            onChange={(e) => handleFilterChange('minRevenue', e.target.value)}
            placeholder="—"
            className="bg-[#0F1622] border border-[#223444] text-[#EDF2FA] rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#00FF00] hover:border-[#8299B4] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] uppercase tracking-wide text-[#5E7488] px-1">Выручка до, ₽</label>
          <input
            type="number"
            min="0"
            value={filters.maxRevenue}
            onChange={(e) => handleFilterChange('maxRevenue', e.target.value)}
            placeholder="—"
            className="bg-[#0F1622] border border-[#223444] text-[#EDF2FA] rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:border-[#00FF00] hover:border-[#8299B4] transition-colors"
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onAction={handleBulkAction}
        onClear={() => setSelectedIds([])}
      />

      {/* Table */}
      <Table
        headers={headers}
        rows={rows}
        loading={loading}
        isEmpty={!loading && sorted.length === 0}
        emptyMessage="Клиенты не найдены. Попробуйте изменить фильтры."
      />
    </div>
  )
}
