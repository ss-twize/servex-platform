'use client'

import { RefreshCw, Bell, Star, Settings, AlertCircle, Activity } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { useActionLog } from '@/lib/hooks/useActionLog'
import type { ActionLogEvent } from '@/lib/hooks/useActionLog'

const ACTION_LABELS: Record<string, string> = {
  vozvrat_klienta: 'Возврат клиента',
  napominaniya: 'Напоминание отправлено',
  blagodarnost: 'Благодарность отправлена',
  toggle_channel: 'Изменён канал связи',
  toggle_module: 'Изменён модуль',
  toggle_system: 'Изменена система',
  greeting_updated: 'Обновлено приветствие',
  settings_updated: 'Настройки обновлены',
}

function getActionLabel(code: string): string {
  return ACTION_LABELS[code] ?? code.replace(/_/g, ' ')
}

function getIcon(event: ActionLogEvent) {
  const { action_code, status } = event

  if (status === 'ошибка') {
    return <AlertCircle size={14} className="text-red-400" />
  }
  if (action_code === 'vozvrat_klienta') {
    return <RefreshCw size={14} className="text-[#00FF00]" />
  }
  if (action_code === 'napominaniya') {
    return <Bell size={14} className="text-blue-400" />
  }
  if (action_code === 'blagodarnost') {
    return <Star size={14} className="text-yellow-400" />
  }
  if (action_code.startsWith('toggle_')) {
    return <Settings size={14} className="text-[#5E7488]" />
  }
  return <Activity size={14} className="text-[#5E7488]" />
}

function relativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'только что'
  if (diff < 3600) {
    const mins = Math.floor(diff / 60)
    return `${mins} ${pluralize(mins, 'минуту', 'минуты', 'минут')} назад`
  }
  if (diff < 86400) {
    const hrs = Math.floor(diff / 3600)
    return `${hrs} ${pluralize(hrs, 'час', 'часа', 'часов')} назад`
  }
  if (diff < 172800) return 'вчера'
  const days = Math.floor(diff / 86400)
  return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export default function ActivityFeed() {
  const { events, loading } = useActionLog()

  const displayed = events.slice(0, 20)

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4">
      <h2 className="text-sm font-unbounded text-[#EDF2FA] mb-4">Последние события</h2>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#223444] flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-3 bg-[#223444] rounded w-3/4" />
                <div className="h-2.5 bg-[#223444] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState message="Активность появится после начала работы агента" />
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-0.5 pr-1">
          {displayed.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[#0A0D14] transition-colors"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0A0D14] flex items-center justify-center">
                {getIcon(event)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#EDF2FA] truncate">{getActionLabel(event.action_code)}</p>
                <p className="text-xs text-[#5E7488]">{relativeTime(event.created_at)}</p>
              </div>

              {/* Status dot */}
              <div className="flex-shrink-0">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    event.status === 'успех' ? 'bg-[#00FF00]' : 'bg-red-400'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
