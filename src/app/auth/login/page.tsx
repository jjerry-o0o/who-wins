'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else {
        router.push('/dashboard')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        if (error.message.includes('password') || error.message.includes('Password')) {
          setError('비밀번호는 6자 이상이어야 합니다.')
        } else {
          setError(error.message)
        }
      } else if (data.session) {
        router.push('/dashboard')
      } else {
        setError('이미 사용 중인 이메일이거나 이메일 인증이 필요합니다.')
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="text-center">
          <h1 className="text-3xl font-black text-white">
            Who<span className="text-violet-400">Wins</span>?
          </h1>
          <p className="text-gray-500 text-sm mt-1">진행자 로그인</p>
        </div>

        <div className="flex bg-gray-900 rounded-xl p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              mode === 'login' ? 'bg-violet-600 text-white' : 'text-gray-500'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              mode === 'signup' ? 'bg-violet-600 text-white' : 'text-gray-500'
            }`}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-violet-600 active:bg-violet-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => router.push('/auth/reset')}
              className="text-gray-500 text-sm text-center"
            >
              비밀번호를 잊으셨나요?
            </button>
          )}
        </form>

      </div>
    </main>
  )
}
