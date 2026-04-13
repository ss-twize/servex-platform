'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_ORG_UID } from '@/lib/constants'

interface KnowledgeFile {
  id: string
  name: string
  file_type: string
  content: string | null
  status: string
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  загружен: 'Загружен',
  обрабатывается: 'Обрабатывается',
  ошибка: 'Ошибка',
}

const STATUS_COLOR: Record<string, string> = {
  загружен: 'text-[#00FF00] bg-[rgba(0,255,0,0.1)]',
  обрабатывается: 'text-yellow-400 bg-yellow-400/10',
  ошибка: 'text-red-400 bg-red-400/10',
}

export function KnowledgeTab() {
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadFiles = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('knowledge_files')
      .select('*')
      .eq('org_uid', DEFAULT_ORG_UID)
      .order('created_at', { ascending: false })
    setFiles((data as KnowledgeFile[]) ?? [])
    setLoadingFiles(false)
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  async function handleSaveText() {
    if (!text.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const date = new Date().toLocaleDateString('ru-RU')
      const { error } = await supabase.from('knowledge_files').insert({
        org_uid: DEFAULT_ORG_UID,
        name: `Текст от ${date}`,
        file_type: 'text',
        content: text.trim(),
        status: 'загружен',
      })
      if (error) throw error
      setText('')
      setMessage({ text: 'Текст сохранён в базу знаний', ok: true })
      await loadFiles()
    } catch {
      setMessage({ text: 'Ошибка при сохранении', ok: false })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const supabase = createClient()
      await supabase.from('knowledge_files').delete().eq('id', id)
      setFiles(prev => prev.filter(f => f.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Text input section */}
      <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-4">
        <h3 className="text-white font-medium mb-3">Добавить текст</h3>
        <textarea
          rows={5}
          className="bg-[#141E2B] border border-[#223444] rounded-lg px-3 py-2 text-white w-full focus:border-[#00FF00] outline-none transition-colors resize-none"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Введите информацию о компании — агент будет использовать этот текст при ответах клиентам"
        />
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={handleSaveText}
            disabled={saving || !text.trim()}
            className="bg-[#00FF00] text-[#0A0D14] font-semibold px-5 py-2 rounded-lg hover:bg-[#00DD00] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Сохранение...' : 'Сохранить текст'}
          </button>
          <button
            disabled
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-[#223444] text-[#5E7488] opacity-50 cursor-not-allowed"
          >
            <Upload size={14} />
            Загрузить файл (скоро)
          </button>
          {message && (
            <span className={`text-sm ${message.ok ? 'text-[#00FF00]' : 'text-red-400'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>

      {/* File list section */}
      <div>
        <h3 className="text-white font-medium mb-3">
          Файлы и тексты{' '}
          {files.length > 0 && (
            <span className="text-sm text-[#5E7488] font-normal">({files.length})</span>
          )}
        </h3>

        {loadingFiles ? (
          <div className="text-[#5E7488] py-4">Загрузка...</div>
        ) : files.length === 0 ? (
          <div className="bg-[#0F1622] border border-[#223444] rounded-xl p-6 text-center">
            <FileText size={32} className="mx-auto mb-3 text-[#5E7488]" />
            <p className="text-[#5E7488] text-sm">
              База знаний пуста. Добавьте информацию об услугах, правилах и ответах на частые вопросы.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="bg-[#0F1622] border border-[#223444] rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <FileText size={18} className="text-[#5E7488] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{file.name}</p>
                  <p className="text-[#5E7488] text-xs">
                    {new Date(file.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[file.status] ?? 'text-[#5E7488] bg-[#223444]'}`}>
                  {STATUS_LABEL[file.status] ?? file.status}
                </span>
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  className="text-[#5E7488] hover:text-red-400 disabled:opacity-40 transition-colors flex-shrink-0"
                  aria-label="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
