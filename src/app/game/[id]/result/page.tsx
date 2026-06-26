import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Player, RoundWithScores, PlayerStanding } from '@/lib/supabase/types'

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

const RANK_STYLE = [
  { emoji: '🥇', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { emoji: '🥈', color: 'text-gray-300', bg: 'bg-gray-800 border-gray-700' },
  { emoji: '🥉', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
]

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()

  if (!game) redirect('/dashboard')
  if (game.status !== 'finished') redirect(`/game/${id}`)

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', id)
    .order('created_at')

  const { data: rounds } = await supabase
    .from('rounds')
    .select('*, scores(*)')
    .eq('game_id', id)
    .order('round_number')

  const typedRounds = (rounds ?? []) as RoundWithScores[]
  const standings = calculateStandings(players ?? [], typedRounds)

  return (
    <main className="min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6 py-4">

        <div className="text-center flex flex-col gap-1">
          <p className="text-gray-500 text-sm">게임 종료</p>
          <h1 className="text-2xl font-black text-white">{game.name}</h1>
          <p className="text-gray-600 text-xs">{rounds?.length ?? 0}라운드 진행</p>
        </div>

        {standings[0] && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-center flex flex-col gap-2">
            <p className="text-4xl">🏆</p>
            {standings.filter(p => p.rank === 1).map(p => (
              <p key={p.id} className="text-amber-400 font-black text-2xl">{p.nickname}</p>
            ))}
            <p className="text-amber-300/60 text-sm">{standings[0].totalScore}점</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-gray-400 text-sm font-medium">최종 순위</h2>
          {standings.map((player) => {
            const style = RANK_STYLE[player.rank - 1] ?? { emoji: `${player.rank}`, color: 'text-gray-600', bg: 'bg-gray-900 border-gray-800' }
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl border ${style.bg}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{style.emoji}</span>
                  <span className={`font-medium ${player.rank <= 3 ? 'text-white' : 'text-gray-300'}`}>
                    {player.nickname}
                  </span>
                </div>
                <span className={`font-black text-lg ${style.color}`}>
                  {player.totalScore}점
                </span>
              </div>
            )
          })}
        </div>

        {typedRounds.length > 0 && players && (
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
              {typedRounds.map(round => (
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

        <div className="flex flex-col gap-3 pb-4">
          <Link
            href="/dashboard/new"
            className="w-full py-4 bg-violet-600 active:bg-violet-700 text-white font-bold text-lg rounded-2xl text-center"
          >
            새 게임 만들기
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-4 bg-gray-800 active:bg-gray-700 text-gray-300 font-bold text-lg rounded-2xl text-center border border-gray-700"
          >
            대시보드로
          </Link>
        </div>

      </div>
    </main>
  )
}
