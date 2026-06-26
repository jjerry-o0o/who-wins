'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Game, Player, RoundWithScores, PlayerStanding } from '@/lib/supabase/types'
import { endGame } from '@/app/actions/round'
import ScoreInput from './ScoreInput'

function calculateStandings(players: Player[], rounds: RoundWithScores[]): PlayerStanding[] {
  const sorted = players
    .map(player => ({
      id: player.id,
      nickname: player.nickname,
      totalScore: rounds.reduce((sum, round) => {
        const score = round.scores.find(s => s.player_id === player.id)
        return sum + (score?.score ?? 0)
      }, 0),
      rank: 0,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)

  return sorted.reduce<PlayerStanding[]>((acc, player, index) => {
    const rank = index === 0
      ? 1
      : player.totalScore === acc[index - 1].totalScore
        ? acc[index - 1].rank
        : index + 1
    return [...acc, { ...player, rank }]
  }, [])
}

interface Props {
  game: Game
  players: Player[]
  rounds: RoundWithScores[]
}

export default function GameBoard({ game, players, rounds: initialRounds }: Props) {
  const router = useRouter()
  const [rounds, setRounds] = useState(initialRounds)
  const [awaitingChoice, setAwaitingChoice] = useState(false)
  const [ending, setEnding] = useState(false)

  const standings = calculateStandings(players, rounds)
  const currentRound = rounds.length + 1

  async function handleEndGame() {
    setEnding(true)
    const result = await endGame(game.id)
    if (result.error) {
      setEnding(false)
      return
    }
    router.push(`/game/${game.id}/result`)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        <div className="flex items-center justify-between pt-2">
          <h1 className="text-xl font-black text-white">{game.name}</h1>
          <span className="text-xs text-gray-500">{rounds.length}라운드 완료</span>
        </div>

        {rounds.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-400 text-sm font-medium">현재 순위</h2>
            {standings.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  player.rank === 1
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black w-6 text-center ${
                    player.rank === 1 ? 'text-amber-400' : 'text-gray-600'
                  }`}>
                    {player.rank === 1 ? '👑' : player.rank}
                  </span>
                  <span className="text-white font-medium">{player.nickname}</span>
                </div>
                <span className={`font-black text-lg ${player.rank === 1 ? 'text-amber-400' : 'text-white'}`}>
                  {player.totalScore}점
                </span>
              </div>
            ))}
          </div>
        )}

        {rounds.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-400 text-sm font-medium">라운드 기록</h2>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div
                className="grid border-b border-gray-800 px-4 py-2"
                style={{ gridTemplateColumns: `80px repeat(${players.length}, 1fr)` }}
              >
                <span className="text-gray-600 text-xs">라운드</span>
                {players.map(p => (
                  <span key={p.id} className="text-gray-600 text-xs text-center truncate">{p.nickname}</span>
                ))}
              </div>
              {rounds.map(round => (
                <div
                  key={round.id}
                  className="grid border-b border-gray-800 last:border-0 px-4 py-3"
                  style={{ gridTemplateColumns: `80px repeat(${players.length}, 1fr)` }}
                >
                  <span className="text-gray-400 text-sm">{round.round_number}R</span>
                  {players.map(p => {
                    const score = round.scores.find(s => s.player_id === p.id)
                    return (
                      <span key={p.id} className="text-white text-sm text-center">
                        {score?.score ?? '-'}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {awaitingChoice ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setAwaitingChoice(false)}
              className="w-full py-4 bg-violet-600 active:bg-violet-700 text-white font-bold text-lg rounded-2xl"
            >
              + 라운드 추가하기
            </button>
            <button
              onClick={handleEndGame}
              disabled={ending}
              className="w-full py-4 bg-gray-800 active:bg-gray-700 disabled:opacity-50 text-gray-300 font-bold text-lg rounded-2xl border border-gray-700"
            >
              {ending ? '종료 중...' : '게임 종료하기'}
            </button>
          </div>
        ) : (
          <ScoreInput
            gameId={game.id}
            players={players}
            currentRound={currentRound}
            onSuccess={(newRound) => {
              setRounds(prev => [...prev, newRound])
              setAwaitingChoice(true)
            }}
          />
        )}

      </div>
    </main>
  )
}
