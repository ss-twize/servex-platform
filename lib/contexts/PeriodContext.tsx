'use client'

import { createContext, useContext, useState, useMemo } from 'react'

export type Period = 'today' | '7days' | '30days' | 'month' | 'custom'

interface PeriodContextValue {
  period: Period
  setPeriod: (p: Period) => void
  dateFrom: Date
  dateTo: Date
}

function computeDates(period: Period): { dateFrom: Date; dateTo: Date } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

  switch (period) {
    case 'today':
      return { dateFrom: today, dateTo: endOfToday }
    case '7days': {
      const from = new Date(today)
      from.setDate(from.getDate() - 6)
      return { dateFrom: from, dateTo: endOfToday }
    }
    case '30days': {
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      return { dateFrom: from, dateTo: endOfToday }
    }
    case 'month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1)
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
      return { dateFrom: from, dateTo: to }
    }
    case 'custom':
      return { dateFrom: today, dateTo: endOfToday }
    default:
      return { dateFrom: today, dateTo: endOfToday }
  }
}

export const PeriodContext = createContext<PeriodContextValue>({
  period: '30days',
  setPeriod: () => {},
  dateFrom: computeDates('30days').dateFrom,
  dateTo: computeDates('30days').dateTo,
})

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>('30days')

  const { dateFrom, dateTo } = useMemo(() => computeDates(period), [period])

  return (
    <PeriodContext.Provider value={{ period, setPeriod, dateFrom, dateTo }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod() {
  return useContext(PeriodContext)
}
