'use client'

import { useState, useEffect } from 'react'
import { useOrgSettings } from '@/lib/hooks/useOrgSettings'

const inputClass =
  'bg-[#141E2B] border border-[#223444] rounded-lg px-3 py-2 text-white w-full focus:border-[#00FF00] outline-none transition-colors'
const labelClass = 'text-sm text-[#8299B4] mb-1 block'

interface FieldConfig {
  key: keyof SegForm
  label: string
  hint: string
}

interface SegForm {
  active_threshold_days: number
  at_risk_threshold_days: number
  inactive_threshold_days: number
  vip_visits_threshold: number
  vip_revenue_threshold: number
}

const FIELDS: FieldConfig[] = [
  {
    key: 'active_threshold_days',
    label: 'Активный клиент (дней с последнего визита)',
    hint: 'Клиент считается активным, если посещал салон в течение этого периода',
  },
  {
    key: 'at_risk_threshold_days',
    label: 'Под риском (дней без визита)',
    hint: 'Клиент переходит в статус «под риском», если не приходил дольше указанного периода',
  },
  {
    key: 'inactive_threshold_days',
    label: 'Потерянный клиент (дней без визита)',
    hint: 'Клиент считается потерянным после длительного отсутствия',
  },
  {
    key: 'vip_visits_threshold',
    label: 'Минимум визитов для статуса «важный»',
    hint: 'Количество визитов, необходимое для получения особого статуса',
  },
  {
    key: 'vip_revenue_threshold',
    label: 'Минимум выручки для статуса «важный» (₽)',
    hint: 'Суммарная выручка от клиента для получения особого статуса',
  },
]

export function SegmentationTab() {
  const { settings, loading, updateSettings } = useOrgSettings()
  const [form, setForm] = useState<SegForm>({
    active_threshold_days: 30,
    at_risk_threshold_days: 50,
    inactive_threshold_days: 90,
    vip_visits_threshold: 10,
    vip_revenue_threshold: 50000,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!loading) {
      setForm({
        active_threshold_days: settings.active_threshold_days,
        at_risk_threshold_days: settings.at_risk_threshold_days,
        inactive_threshold_days: settings.inactive_threshold_days,
        vip_visits_threshold: settings.vip_visits_threshold,
        vip_revenue_threshold: settings.vip_revenue_threshold,
      })
    }
  }, [loading, settings])

  function setField(key: keyof SegForm, value: string) {
    setForm(prev => ({ ...prev, [key]: Number(value) }))
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      await updateSettings(form)
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
      {FIELDS.map(({ key, label, hint }) => (
        <div key={key}>
          <label className={labelClass}>{label}</label>
          <input
            type="number"
            className={inputClass}
            value={form[key]}
            onChange={e => setField(key, e.target.value)}
            min={0}
          />
          <p className="text-xs text-[#5E7488] mt-1">{hint}</p>
        </div>
      ))}

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
