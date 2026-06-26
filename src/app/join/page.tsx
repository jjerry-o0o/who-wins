'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function JoinPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState<'enter' | 'nickname'>('enter')
  const [gameId, setGameId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, status')
      .eq('password', password.toUpperCase())
      .neq('status', 'finished')
      .single()

    if (gameError || !game) {
      setError('비밀번호가 올바르지 않거나 종료된 게임입니다.')
      setLoading(false)
      return
    }

    setGameId(game.id)
    setStep('nickname')
    setLoading(false)
  }

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({ game_id: gameId, nickname })
      .select('id')
      .single()

    if (playerError || !player) {
      setError('입장에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    localStorage.setItem(
      'player_session',
      JSON.stringify({ gameId, playerId: player.id, nickname, isHost: false })
    )

    router.push(`/game/${gameId}`)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="text-center">
          <h1 className="text-3xl font-black text-white">
            Who<span className="text-violet-400">Wins</span>?
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'enter' ? '게임 입장' : '닉네임 설정'}
          </p>
        </div>

        {step === 'enter' && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="참여 비밀번호 (예: AB3K7P)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={6}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 uppercase tracking-widest text-center text-lg font-bold"
            />

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-violet-600 active:bg-violet-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl"
            >
              {loading ? '확인 중...' : '입장하기'}
            </button>
          </form>
        )}

        {step === 'nickname' && (
          <form onSubmit={handleNickname} className="flex flex-col gap-4">
            <p className="text-gray-400 text-sm text-center">
              게임에서 사용할 닉네임을 입력해주세요
            </p>
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-center text-lg"
            />

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-violet-600 active:bg-violet-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl"
            >
              {loading ? '입장 중...' : '게임 참여'}
            </button>
          </form>
        )}

      </div>
    </main>
  )
}
