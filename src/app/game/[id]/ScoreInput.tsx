'use client'

import { useState } from 'react'
import { Player } from '@/lib/supabase/types'
import { submitRoundScores } from '@/app/actions/round'

interface Props {
  gameId: string
  players: Player[]
  currentRound: number
  onSuccess: () => void
}

export default function ScoreInput({ gameId, players, currentRound, onSuccess }: Props) {
  const [scores, setScores] = useState<Record<string, string>>(
    Object.fromEntries(players.map(p => [p.id, '']))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateScore(playerId: string, value: string) {
    setScores(prev => ({ ...prev, [playerId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (players.some(p => scores[p.id] === '')) {
      setError('모든 플레이어의 점수를 입력해주세요.')
      return
    }

    const parsed = players.map(p => ({
      playerId: p.id,
      score: Number(scores[p.id]),
    }))

    setLoading(true)
    const result = await submitRoundScores(gameId, currentRound, parsed)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onSuccess()
    setLoading(false)
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col gap-4">
      <h2 className="text-white font-bold">{currentRound}라운드 점수 입력</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {players.map(player => (
          <div key={player.id} className="flex items-center gap-3">
            <span className="text-gray-300 text-sm flex-1">{player.nickname}</span>
            <input
              type="number"
              value={scores[player.id]}
              onChange={e => updateScore(player.id, e.target.value)}
              placeholder="0"
              className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-center focus:outline-none focus:border-violet-500"
            />
          </div>
        ))}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-violet-600 active:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl mt-1"
        >
          {loading ? '저장 중...' : `${currentRound}라운드 완료`}
        </button>
      </form>
    </div>
  )
}
