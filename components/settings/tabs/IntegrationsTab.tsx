'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useOrgSettings } from '@/lib/hooks/useOrgSettings'
import { useYClientsIntegrations, YClientsIntegration } from '@/lib/hooks/useYClientsIntegrations'
import { callWebhook } from '@/lib/webhooks'
import { DEFAULT_ORG_UID } from '@/lib/constants'

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<YClientsIntegration['status'], string> = {
  active: 'Подключено',
  pending_activation: 'Подключаем...',
  activation_failed: 'Ошибка подключения',
  syncing: 'Синхронизация данных...',
  disconnected: 'Отключено в YClients',
  degraded: 'Проблемы с синхронизацией',
}

const STATUS_COLOR: Record<YClientsIntegration['status'], string> = {
  active: '#00FF00',
  pending_activation: '#F5A623',
  activation_failed: '#F05252',
  syncing: '#00FF00',
  disconnected: '#5E7488',
  degraded: '#F5A623',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="7" cy="7" r="6" stroke="#F5A623" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  )
}

// ─── YClients integration card ─────────────────────────────────────────────────

const YCLIENTS_APP_LINK = process.env.NEXT_PUBLIC_YCLIENTS_APP_LINK ?? '#'

interface YClientsFilialCardProps {
  integration: YClientsIntegration
  onSync: (integration: YClientsIntegration) => Promise<void>
  syncing: boolean
}

function YClientsFilialCard({ integration, onSync, syncing }: YClientsFilialCardProps) {
  const color = STATUS_COLOR[integration.status]
  const label = STATUS_LABEL[integration.status]
  const isPending = integration.status === 'pending_activation' || integration.status === 'syncing'

  return (
    <div className="mt-3 bg-[#0a0f1a] border border-[#1a2a3a] rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status row */}
          <div className="flex items-center gap-2 mb-1">
            {isPending ? (
              <Spinner />
            ) : (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="text-sm font-medium" style={{ color }}>
              {label}
            </span>
          </div>

          {/* Salon info */}
          {integration.salon_name && (
            <p className="text-sm text-[#EDF2FA] mb-0.5 ml-4">
              {integration.salon_name}
            </p>
          )}
          <p className="text-xs text-[#5E7488] ml-4">
            Филиал: <span className="font-mono text-[#7a94aa]">{integration.salon_id}</span>
          </p>
          {integration.status === 'active' && (
            <>
              {integration.connected_at && (
                <p className="text-xs text-[#5E7488] ml-4">
                  Подключено: {formatDate(integration.connected_at)}
                </p>
              )}
              {integration.last_sync_at && (
                <p className="text-xs text-[#5E7488] ml-4">
                  Синхронизировано: {formatDate(integration.last_sync_at)}
                </p>
              )}
            </>
          )}
          {integration.status === 'activation_failed' && integration.sync_error && (
            <p className="text-xs text-red-400 ml-4 mt-0.5 truncate max-w-xs">
              {integration.sync_error}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          {(integration.status === 'active' || integration.status === 'syncing' || integration.status === 'degraded') && (
            <button
              onClick={() => onSync(integration)}
              disabled={syncing}
              className="text-xs px-3 py-1 rounded-lg border border-[#223444] text-[#EDF2FA] hover:border-[#00FF00] hover:text-[#00FF00] disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {syncing ? 'Синхронизация...' : integration.status === 'syncing' ? 'Повторить' : 'Синхронизировать'}
            </button>
          )}
          {(integration.status === 'activation_failed' || integration.status === 'disconnected') && (
            <a
              href={YCLIENTS_APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1 rounded-lg border border-[#223444] text-[#EDF2FA] hover:border-[#00FF00] hover:text-[#00FF00] transition-colors whitespace-nowrap"
            >
              {integration.status === 'disconnected' ? 'Переподключить' : 'Попробовать снова'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Simple integration card (Telegram / WhatsApp) ─────────────────────────────

interface SimpleCardProps {
  title: string
  connected: boolean
  hint: string
  extraInfo?: React.ReactNode
  onAction: () => Promise<{ success: boolean; error?: string }>
  actionLabel: string
}

function SimpleIntegrationCard({
  title,
  connected,
  hint,
  extraInfo,
  onAction,
  actionLabel,
}: SimpleCardProps) {
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
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: connected ? 'rgba(0,255,0,0.1)' : 'rgba(94,116,136,0.15)',
                color: connected ? '#00FF00' : '#5E7488',
              }}
            >
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

// ─── Main tab ──────────────────────────────────────────────────────────────────

export function IntegrationsTab() {
  const { settings, loading: settingsLoading, updateSettings } = useOrgSettings()
  const { integrations, loading: integrationsLoading, refetch } = useYClientsIntegrations()
  const searchParams = useSearchParams()

  const connectedParam = searchParams.get('connected')
  const errorParam = searchParams.get('error')

  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())

  async function handleSync(integration: YClientsIntegration) {
    setSyncingIds((prev) => new Set(prev).add(integration.id))
    try {
      await fetch('/api/yclients/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration_id: integration.id,
          salon_id: integration.salon_id,
          org_uid: DEFAULT_ORG_UID,
        }),
      })
      await refetch()
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.delete(integration.id)
        return next
      })
    }
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

  if (settingsLoading) {
    return <div className="text-[#5E7488] py-8">Загрузка...</div>
  }

  return (
    <div className="max-w-2xl">
      {/* Success / error alerts from redirect params */}
      {connectedParam === 'true' && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-[#00FF00]/30 bg-[#00FF00]/5 text-[#00FF00] text-sm">
          Интеграция с YClients успешно подключена
        </div>
      )}
      {errorParam === 'activation_failed' && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          Не удалось активировать интеграцию. Попробуйте подключить снова.
        </div>
      )}
      {errorParam === 'no_salon_id' && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          Ошибка: YClients не передал идентификатор салона.
        </div>
      )}

      {/* ── YClients card ──────────────────────────────────────────────────── */}
      <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4 mb-3">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium">YClients</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor:
                    integrations.length > 0 ? 'rgba(0,255,0,0.1)' : 'rgba(94,116,136,0.15)',
                  color: integrations.length > 0 ? '#00FF00' : '#5E7488',
                }}
              >
                {integrationsLoading
                  ? '...'
                  : integrations.length > 0
                  ? `${integrations.length} филиал${integrations.length === 1 ? '' : integrations.length < 5 ? 'а' : 'ов'}`
                  : 'Не подключено'}
              </span>
            </div>
            <p className="text-sm text-[#5E7488]">
              Синхронизация клиентов и записей через маркетплейс YClients
            </p>
          </div>

          {/* Main connect button — opens YClients marketplace page */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <a
              href={YCLIENTS_APP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-1.5 rounded-lg border border-[#00FF00]/50 text-[#00FF00] hover:bg-[#00FF00]/10 transition-colors whitespace-nowrap font-medium"
            >
              Подключить через YClients
            </a>
            {integrations.some((i) => i.status === 'active') && (
              <a
                href={YCLIENTS_APP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1 rounded-lg border border-[#223444] text-[#5E7488] hover:border-[#00FF00] hover:text-[#00FF00] transition-colors whitespace-nowrap"
              >
                Переподключить
              </a>
            )}
          </div>
        </div>

        {/* Connected filials list */}
        {!integrationsLoading && integrations.length > 0 && (
          <div className="mt-2">
            {integrations.map((integration) => (
              <YClientsFilialCard
                key={integration.id}
                integration={integration}
                onSync={handleSync}
                syncing={syncingIds.has(integration.id)}
              />
            ))}
          </div>
        )}

        {integrationsLoading && (
          <p className="text-xs text-[#5E7488] mt-2">Загрузка интеграций...</p>
        )}
      </div>

      {/* ── Telegram ───────────────────────────────────────────────────────── */}
      <SimpleIntegrationCard
        title="Telegram"
        connected={settings.telegram_connected}
        hint="Бот будет принимать сообщения от клиентов"
        onAction={connectTelegram}
        actionLabel={settings.telegram_connected ? 'Переподключить' : 'Подключить'}
      />

      {/* ── WhatsApp ───────────────────────────────────────────────────────── */}
      <SimpleIntegrationCard
        title="WhatsApp"
        connected={settings.whatsapp_connected}
        hint="Через GREEN-API"
        onAction={connectWhatsApp}
        actionLabel={settings.whatsapp_connected ? 'Переподключить' : 'Подключить'}
      />
    </div>
  )
}
