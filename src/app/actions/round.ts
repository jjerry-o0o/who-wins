'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitRoundScores(
  gameId: string,
  roundNumber: number,
  scores: { playerId: string; score: number }[]
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: round, error: roundError } = await supabase
    .from('rounds')
    .insert({ game_id: gameId, round_number: roundNumber })
    .select('id')
    .single()

  if (roundError || !round) return { error: '라운드 저장에 실패했습니다.' }

  const { error: scoresError } = await supabase
    .from('scores')
    .insert(scores.map(({ playerId, score }) => ({
      round_id: round.id,
      player_id: playerId,
      score,
    })))

  if (scoresError) return { error: '점수 저장에 실패했습니다.' }

  if (roundNumber === 1) {
    await supabase
      .from('games')
      .update({ status: 'playing', started_at: new Date().toISOString() })
      .eq('id', gameId)
  }

  revalidatePath(`/game/${gameId}`)
  return { success: true }
}

export async function endGame(gameId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { error } = await supabase
    .from('games')
    .update({ status: 'finished', finished_at: new Date().toISOString() })
    .eq('id', gameId)
    .eq('host_id', user.id)

  if (error) return { error: '게임 종료에 실패했습니다.' }

  revalidatePath(`/game/${gameId}`)
  return { success: true }
}
