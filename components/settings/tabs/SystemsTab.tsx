'use client'

import { useSystemStates } from '@/lib/hooks/useSystemStates'
import { Toggle } from '@/components/ui/Toggle'

const MVP_SYSTEMS = [
  {
    code: 'napominaniya',
    name: 'Напоминания',
    description: 'Автоматически напоминает клиентам о предстоящих визитах',
  },
  {
    code: 'vozvrat_klienta',
    name: 'Возврат клиента',
    description: 'Возвращает клиентов, которые давно не приходили',
  },
  {
    code: 'blagodarnost',
    name: 'Благодарность',
    description: 'Отправляет сообщение с благодарностью после визита',
  },
]

export function SystemsTab() {
  const { states, loading, toggleState } = useSystemStates()

  function getEnabled(code: string): boolean {
    const found = states.find(s => s.system_code === code)
    return found?.enabled ?? false
  }

  if (loading) {
    return <div className="text-[#5E7488] py-8">Загрузка...</div>
  }

  return (
    <div className="max-w-2xl">
      {MVP_SYSTEMS.map(system => {
        const enabled = getEnabled(system.code)
        return (
          <div
            key={system.code}
            className="bg-[#0F1622] border border-[#223444] rounded-xl p-4 mb-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: enabled ? '#00FF00' : '#5E7488' }}
                  />
                  <span className="text-white font-medium">{system.name}</span>
                </div>
                <p className="text-sm text-[#5E7488] ml-4">{system.description}</p>
                <p className="text-xs ml-4 mt-1" style={{ color: enabled ? '#00FF00' : '#5E7488' }}>
                  {enabled ? 'Активна' : 'Выключена'}
                </p>
              </div>
              <Toggle
                enabled={enabled}
                onChange={val => toggleState(system.code, val)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
