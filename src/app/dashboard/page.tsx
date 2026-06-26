import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Game } from '@/lib/supabase/types'

const statusLabel: Record<string, string> = {
  waiting: '대기 중',
  playing: '진행 중',
  finished: '종료',
}

const statusColor: Record<string, string> = {
  waiting: 'text-gray-400 bg-gray-800',
  playing: 'text-green-400 bg-green-400/10',
  finished: 'text-gray-600 bg-gray-800',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">
            Who<span className="text-violet-400">Wins</span>?
          </h1>
          <Link
            href="/dashboard/new"
            className="px-4 py-2 bg-violet-600 active:bg-violet-700 text-white font-bold text-sm rounded-xl"
          >
            + 새 게임
          </Link>
        </div>

        {!games || games.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="text-5xl">🎲</div>
            <p className="text-gray-400 font-medium">아직 게임이 없습니다</p>
            <p className="text-gray-600 text-sm">새 게임을 만들어보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {games.map((game: Game) => (
              <Link
                key={game.id}
                href={game.status === 'finished' ? `/game/${game.id}/result` : `/game/${game.id}`}
                className="w-full p-4 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-between active:bg-gray-800"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-white font-bold">{game.name}</span>
                  <span className="text-gray-500 text-xs">
                    {game.total_rounds}라운드
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${statusColor[game.status]}`}>
                  {statusLabel[game.status]}
                </span>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
