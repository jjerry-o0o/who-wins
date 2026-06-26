'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      setError('이메일 전송에 실패했습니다. 다시 시도해주세요.')
    } else {
      setSent(true)
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
          <p className="text-gray-500 text-sm mt-1">비밀번호 재설정</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="text-5xl">📧</div>
            <p className="text-white font-bold">이메일을 확인해주세요</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              {email} 으로<br />재설정 링크를 보냈습니다
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 text-violet-400 text-sm"
            >
              로그인으로 돌아가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-gray-400 text-sm text-center">
              가입한 이메일을 입력하면<br />재설정 링크를 보내드립니다
            </p>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              {loading ? '전송 중...' : '재설정 링크 받기'}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-500 text-sm text-center"
            >
              돌아가기
            </button>
          </form>
        )}

      </div>
    </main>
  )
}
