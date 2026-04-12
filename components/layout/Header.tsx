'use client'

import { useEffect, useState } from 'react'
import { usePeriod, type Period } from '@/lib/contexts/PeriodContext'
import { createClient } from '@/lib/supabase/client'

const periodTabs: { value: Period; label: string }[] = [
  { value: 'today',  label: 'Сегодня'       },
  { value: '7days',  label: '7 дней'        },
  { value: '30days', label: '30 дней'       },
  { value: 'month',  label: 'Этот месяц'    },
  { value: 'custom', label: 'Произвольный'  },
]

export default function Header() {
  const { period, setPeriod } = usePeriod()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null)
    })
  }, [])

  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-[#0A0D14] border-b border-[#223444] flex items-center px-5 z-40">
      {/* Period filter tabs */}
      <div className="flex items-center gap-1">
        {periodTabs.map((tab) => {
          const isActive = period === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setPeriod(tab.value)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#00FF00] text-black'
                  : 'text-[#5E7488] hover:text-[#8299B4]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User email */}
      {email && (
        <span className="text-[#5E7488] text-sm font-montserrat truncate max-w-xs">
          {email}
        </span>
      )}
    </header>
  )
}
