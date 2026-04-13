'use client'

import { useState } from 'react'
import { useOrgSettings } from '@/lib/hooks/useOrgSettings'
import { callWebhook } from '@/lib/webhooks'

interface IntegrationCardProps {
  title: string
  connected: boolean
  hint: string
  extraInfo?: React.ReactNode
  onAction: () => Promise<{ success: boolean; error?: string }>
  actionLabel: string
}

function IntegrationCard({ title, connected, hint, extraInfo, onAction, actionLabel }: IntegrationCardProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  async function handleClick() {
    setLoading(true)
    setMessage(null)
    try {
      const result = await onAction()
      setMessage({ text: result.success ? 'Подключено' : 'Статус обновлён', ok: true })
    } catch {
      setMessage({ text: 'Ошибка при подключении', ok: false })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: connected ? '#00FF00' : '#5E7488' }}
            />
            <span className="text-white font-medium">{title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{
              backgroundColor: connected ? 'rgba(0,255,0,0.1)' : 'rgba(94,116,136,0.15)',
              color: connected ? '#00FF00' : '#5E7488'
            }}>
              {connected ? 'Подключено' : 'Не подключено'}
            </span>
          </div>
          {extraInfo && <div className="ml-4 mb-1">{extraInfo}</div>}
          <p className="text-sm text-[#5E7488] ml-4">{hint}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleClick}
            disabled={loading}
            className="text-sm px-4 py-1.5 rounded-lg border border-[#223444] text-[#EDF2FA] hover:border-[#00FF00] hover:text-[#00FF00] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? 'Загрузка...' : actionLabel}
          </button>
          {message && (
            <span className={`text-xs ${message.ok ? 'text-[#00FF00]' : 'text-red-400'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function IntegrationsTab() {
  const { settings, loading, updateSettings } = useOrgSettings()

  if (loading) {
    return <div className="text-[#5E7488] py-8">Загрузка...</div>
  }

  async function connectYClients() {
    await callWebhook('reconnect_yclients', { company_id: settings.yclients_company_id })
    await updateSettings({ yclients_connected: true, yclients_company_id: settings.yclients_company_id ?? '1647948' })
    return { success: true }
  }

  async function connectTelegram() {
    await callWebhook('connect_telegram', {})
    await updateSettings({ telegram_connected: true })
    return { success: true }
  }

  async function connectWhatsApp() {
    await callWebhook('connect_whatsapp', {})
    await updateSettings({ whatsapp_connected: true })
    return { success: true }
  }

  return (
    <div className="max-w-2xl">
      <IntegrationCard
        title="YClients"
        connected={settings.yclients_connected}
        hint="Синхронизация клиентов и записей"
        extraInfo={
          settings.yclients_company_id ? (
            <p className="text-xs text-[#5E7488]">
              Компания:{' '}
              <span className="text-[#EDF2FA] font-mono">{settings.yclients_company_id}</span>
              {'  ·  '}Последняя синхронизация: —
            </p>
          ) : null
        }
        onAction={connectYClients}
        actionLabel={settings.yclients_connected ? 'Переподключить' : 'Подключить'}
      />

      <IntegrationCard
        title="Telegram"
        connected={settings.telegram_connected}
        hint="Бот будет принимать сообщения от клиентов"
        onAction={connectTelegram}
        actionLabel={settings.telegram_connected ? 'Переподключить' : 'Подключить'}
      />

      <IntegrationCard
        title="WhatsApp"
        connected={settings.whatsapp_connected}
        hint="Через GREEN-API"
        onAction={connectWhatsApp}
        actionLabel={settings.whatsapp_connected ? 'Переподключить' : 'Подключить'}
      />
    </div>
  )
}
