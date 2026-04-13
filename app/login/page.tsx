'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setSuccess(null)
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const supabase = createClient()

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Пароли не совпадают')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов')
        setLoading(false)
        return
      }
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message.includes('already') ? 'Этот email уже зарегистрирован' : 'Ошибка регистрации. Попробуйте ещё раз.')
        setLoading(false)
        return
      }
      setSuccess('Аккаунт создан! Проверьте почту для подтверждения, затем войдите.')
      setLoading(false)
      return
    }

    // login
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Неверный адрес эл. почты или пароль')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  const inputStyle = {
    backgroundColor: '#141E2B',
    border: '1px solid #223444',
    color: '#EDF2FA',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0A0D14' }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ backgroundColor: '#0F1622', border: '1px solid #223444' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider font-unbounded" style={{ color: '#00FF00' }}>
            SERVEX
          </h1>
          <p className="mt-2 text-sm font-montserrat" style={{ color: '#6B7A8D' }}>
            Панель управления
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg mb-6 p-1" style={{ backgroundColor: '#141E2B' }}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className="flex-1 py-2 rounded-md text-sm font-medium font-montserrat transition-colors"
              style={
                mode === m
                  ? { backgroundColor: '#00FF00', color: '#0A0D14' }
                  : { color: '#8299B4' }
              }
            >
              {m === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5 font-montserrat" style={{ color: '#8299B4' }}>
              Эл. почта
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors font-montserrat"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#00FF00')}
              onBlur={(e) => (e.target.style.borderColor = '#223444')}
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5 font-montserrat" style={{ color: '#8299B4' }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors font-montserrat"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#00FF00')}
              onBlur={(e) => (e.target.style.borderColor = '#223444')}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1.5 font-montserrat" style={{ color: '#8299B4' }}>
                Повторите пароль
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors font-montserrat"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#00FF00')}
                onBlur={(e) => (e.target.style.borderColor = '#223444')}
              />
            </div>
          )}

          {error && (
            <p className="text-sm font-montserrat" style={{ color: '#FF4D4D' }}>{error}</p>
          )}
          {success && (
            <p className="text-sm font-montserrat" style={{ color: '#00FF00' }}>{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-medium transition-colors font-montserrat disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            style={{ backgroundColor: '#00FF00', color: '#0A0D14' }}
            onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#ccff33' }}
            onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = '#00FF00' }}
          >
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
      </div>
    </div>
  )
}
