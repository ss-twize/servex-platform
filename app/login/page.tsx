'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Неверный адрес эл. почты или пароль')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0A0D14' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: '#0F1622', border: '1px solid #223444' }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold tracking-wider font-unbounded"
            style={{ color: '#00FF00' }}
          >
            SERVEX
          </h1>
          <p
            className="mt-2 text-sm font-montserrat"
            style={{ color: '#6B7A8D' }}
          >
            Панель управления
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm mb-2 font-montserrat"
              style={{ color: '#EDF2FA' }}
            >
              Эл. почта
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors font-montserrat"
              style={{
                backgroundColor: '#141E2B',
                border: '1px solid #223444',
                color: '#EDF2FA',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00FF00')}
              onBlur={(e) => (e.target.style.borderColor = '#223444')}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm mb-2 font-montserrat"
              style={{ color: '#EDF2FA' }}
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors font-montserrat"
              style={{
                backgroundColor: '#141E2B',
                border: '1px solid #223444',
                color: '#EDF2FA',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00FF00')}
              onBlur={(e) => (e.target.style.borderColor = '#223444')}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm font-montserrat" style={{ color: '#FF4D4D' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-medium transition-colors font-montserrat disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#00FF00', color: '#0A0D14' }}
            onMouseEnter={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#ccff33'
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#00FF00'
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
