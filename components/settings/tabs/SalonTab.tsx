'use client'

import { useState, useEffect } from 'react'
import { useOrgSettings } from '@/lib/hooks/useOrgSettings'

const inputClass =
  'bg-[#141E2B] border border-[#223444] rounded-lg px-3 py-2 text-white w-full focus:border-[#00FF00] outline-none transition-colors'
const labelClass = 'text-sm text-[#8299B4] mb-1 block'

export function SalonTab() {
  const { settings, loading, updateSettings } = useOrgSettings()
  const [form, setForm] = useState({
    salon_name: '',
    timezone: 'Europe/Moscow',
    currency: 'RUB',
    address: '',
    phone: '',
    map_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!loading) {
      setForm({
        salon_name: settings.salon_name ?? '',
        timezone: settings.timezone ?? 'Europe/Moscow',
        currency: settings.currency ?? 'RUB',
        address: settings.address ?? '',
        phone: settings.phone ?? '',
        map_url: settings.map_url ?? '',
      })
    }
  }, [loading, settings])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      await updateSettings({
        salon_name: form.salon_name,
        timezone: form.timezone,
        currency: form.currency,
        address: form.address || null,
        phone: form.phone || null,
        map_url: form.map_url || null,
      })
      setMessage({ text: 'Настройки сохранены', ok: true })
    } catch {
      setMessage({ text: 'Ошибка при сохранении', ok: false })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) {
    return <div className="text-[#5E7488] py-8">Загрузка...</div>
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <label className={labelClass}>Название компании</label>
        <input
          className={inputClass}
          value={form.salon_name}
          onChange={e => set('salon_name', e.target.value)}
          placeholder="Название вашего салона"
        />
      </div>

      <div>
        <label className={labelClass}>Часовой пояс</label>
        <select
          className={inputClass}
          value={form.timezone}
          onChange={e => set('timezone', e.target.value)}
        >
          <option value="Europe/Moscow">Москва (UTC+3)</option>
          <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
          <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
          <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Валюта</label>
        <select
          className={inputClass}
          value={form.currency}
          onChange={e => set('currency', e.target.value)}
        >
          <option value="RUB">Рубль (₽)</option>
          <option value="USD">Доллар ($)</option>
          <option value="EUR">Евро (€)</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Адрес</label>
        <input
          className={inputClass}
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="ул. Примерная, д. 1"
        />
      </div>

      <div>
        <label className={labelClass}>Телефон</label>
        <input
          className={inputClass}
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
          placeholder="+7 (999) 000-00-00"
        />
      </div>

      <div>
        <label className={labelClass}>Ссылка на карты</label>
        <input
          className={inputClass}
          value={form.map_url}
          onChange={e => set('map_url', e.target.value)}
          placeholder="https://yandex.ru/maps/..."
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
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
