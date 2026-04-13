'use client'

import React from 'react'

interface BulkActionBarProps {
  selectedIds: string[]
  onAction: (action: string, ids: string[]) => void
  onClear: () => void
}

export function BulkActionBar({ selectedIds, onAction, onClear }: BulkActionBarProps) {
  if (selectedIds.length === 0) return null

  return (
    <div className="bg-[#0F1622] border border-[#00FF00] rounded-xl p-4 flex flex-wrap items-center gap-4">
      <span className="text-sm text-[#EDF2FA] font-medium">
        Выбрано{' '}
        <span className="text-[#00FF00] font-semibold">{selectedIds.length}</span>{' '}
        {getClientWord(selectedIds.length)}
      </span>

      <div className="flex items-center gap-2 ml-auto flex-wrap">
        <button
          type="button"
          onClick={() => onAction('vozvrat_klienta', selectedIds)}
          className="px-4 py-2 rounded-lg bg-[#00FF00] text-black text-sm font-semibold hover:bg-[#ccff33] transition-colors duration-150"
        >
          Запустить возврат
        </button>
        <button
          type="button"
          onClick={() => onAction('rassylka', selectedIds)}
          className="px-4 py-2 rounded-lg bg-[#141E2B] border border-[#223444] text-[#EDF2FA] text-sm font-medium hover:bg-[#1A2535] hover:border-[#8299B4] transition-colors duration-150"
        >
          Отправить рассылку
        </button>
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2 rounded-lg text-[#5E7488] hover:text-[#EDF2FA] text-sm transition-colors duration-150"
        >
          Снять выбор
        </button>
      </div>
    </div>
  )
}

function getClientWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return 'клиентов'
  if (mod10 === 1) return 'клиента'
  if (mod10 >= 2 && mod10 <= 4) return 'клиента'
  return 'клиентов'
}

export default BulkActionBar
