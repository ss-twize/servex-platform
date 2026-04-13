'use client'

import { useState, useEffect } from 'react'
import { useOrgSettings } from '@/lib/hooks/useOrgSettings'

const labelClass = 'text-sm text-[#8299B4] mb-1 block'

export function AgentTab() {
  const { settings, loading, updateSettings } = useOrgSettings()
  const [greeting, setGreeting] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!loading) {
      setGreeting(settings.greeting_message ?? '')
    }
  }, [loading, settings])

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      await updateSettings({ greeting_message: greeting })
      setMessage({ text: 'Настройки сохранены', ok: true })
    } catch {
      setMessage({ text: 'Ошибка при сохранении', ok: false })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const connectedChannels = [
    settings.yclients_connected && 'YClients',
    settings.telegram_connected && 'Telegram',
    settings.whatsapp_connected && 'WhatsApp',
  ].filter(Boolean) as string[]

  if (loading) {
    return <div className="text-[#5E7488] py-8">Загрузка...</div>
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <label className={labelClass}>Приветственное сообщение</label>
        <textarea
          rows={4}
          className="bg-[#141E2B] border border-[#223444] rounded-lg px-3 py-2 text-white w-full focus:border-[#00FF00] outline-none transition-colors resize-none"
          value={greeting}
          onChange={e => setGreeting(e.target.value)}
          placeholder="Привет! Чем могу помочь?"
        />
        <p className="text-xs text-[#5E7488] mt-1">
          Это сообщение клиент получит при первом обращении
        </p>
      </div>

      <div>
        <label className={labelClass}>Активные каналы</label>
        <div className="bg-[#0F1622] border border-[#223444] rounded-lg px-3 py-3">
          {connectedChannels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {connectedChannels.map(ch => (
                <span
                  key={ch}
                  className="text-sm px-3 py-1 rounded-full bg-[rgba(0,255,0,0.1)] text-[#00FF00]"
                >
                  {ch}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5E7488]">Нет подключённых каналов</p>
          )}
        </div>
        <p className="text-xs text-[#5E7488] mt-1">
          Подключите каналы на вкладке «Интеграции»
        </p>
      </div>

      <div>
        <label className={labelClass}>Режим агента</label>
        <div className="bg-[#0F1622] border border-[#223444] rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#5E7488]" />
          <p className="text-sm text-[#5E7488]">
            Расширенные настройки появятся после подключения каналов
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#00FF00] text-[#0A0D14] font-semibold px-6 py-2 rounded-lg hover:bg-[#00DD00] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {message && (
          <span className={message.ok ? 'text-[#00FF00] text-sm' : 'text-red-400 text-sm'}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  )
}
