'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createGame(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const playerNames = formData.getAll('players') as string[]

  if (!name || playerNames.length < 2) redirect('/dashboard/new?error=invalid')

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({ name, status: 'waiting' })
    .select('id')
    .single()

  if (gameError || !game) redirect('/dashboard?error=create')

  const { error: playersError } = await supabase
    .from('players')
    .insert(playerNames.map(nickname => ({ game_id: game.id, nickname })))

  if (playersError) redirect('/dashboard?error=create')

  redirect(`/game/${game.id}`)
}
