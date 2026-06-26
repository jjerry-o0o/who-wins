import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GameBoard from './GameBoard'

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()

  if (!game) redirect('/dashboard')
  if (game.status === 'finished') redirect(`/game/${id}/result`)

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

  const isHost = user?.id === game.host_id
  const isHostJoined = players?.some(p => p.user_id === user?.id) ?? false

  return (
    <GameBoard
      game={game}
      players={players ?? []}
      rounds={rounds ?? []}
      isHost={isHost}
      isHostJoined={isHostJoined}
    />
  )
}
