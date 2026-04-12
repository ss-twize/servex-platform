'use client'

import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useDashboardStats } from '@/lib/hooks/useDashboardStats'
import { useOrgSettings } from '@/lib/hooks/useOrgSettings'
import { usePeriod } from '@/lib/contexts/PeriodContext'

interface AttentionItem {
  icon: string
  text: string
}

export default function AttentionBlock() {
  const { dateFrom, dateTo } = usePeriod()
  const dateFromStr = dateFrom.toISOString().split('T')[0]
  const dateToStr = dateTo.toISOString().split('T')[0]
  const stats = useDashboardStats(dateFromStr, dateToStr)
  const { settings, loading: settingsLoading } = useOrgSettings()

  const loading = stats.loading || settingsLoading

  const items: AttentionItem[] = []

  if (!loading) {
    if (stats.pendingConfirmation > 0) {
      items.push({
        icon: '⚡',
        text: `${stats.pendingConfirmation} ${pluralizeRecords(stats.pendingConfirmation)} ожидают подтверждения`,
      })
    }
    if (stats.atRiskCount > 0) {
      items.push({
        icon: '⚠',
        text: `${stats.atRiskCount} ${pluralizeClients(stats.atRiskCount)} под риском оттока`,
      })
    }
    if (!settings.yclients_connected) {
      items.push({
        icon: '🔗',
        text: 'Подключите YClients для синхронизации данных',
      })
    }
    if (!settings.telegram_connected && !settings.whatsapp_connected) {
      items.push({
        icon: '📱',
        text: 'Подключите канал связи (Telegram или WhatsApp)',
      })
    }
  }

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={15} className="text-[#F59E0B] flex-shrink-0" />
        <h2 className="text-sm font-unbounded text-[#EDF2FA]">Требует внимания</h2>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 bg-[#223444] rounded w-3/4" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-2 text-[#00FF00]">
          <CheckCircle size={15} />
          <span className="text-sm">Всё в порядке</span>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#EDF2FA]">
              <span className="flex-shrink-0 leading-none mt-0.5">{item.icon}</span>
              <span className="leading-tight">{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function pluralizeRecords(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'записей'
  if (mod10 === 1) return 'запись'
  if (mod10 >= 2 && mod10 <= 4) return 'записи'
  return 'записей'
}

function pluralizeClients(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return 'клиентов'
  if (mod10 === 1) return 'клиент'
  if (mod10 >= 2 && mod10 <= 4) return 'клиента'
  return 'клиентов'
}
