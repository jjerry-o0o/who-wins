'use server'

import { createClient } from '@/lib/supabase/server'
import { generatePassword } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createGame(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const name = formData.get('name') as string
  const maxPlayers = Number(formData.get('maxPlayers'))

  // 활성 게임과 중복되지 않는 비밀번호 생성 (최대 5번 시도)
  let password = ''
  for (let i = 0; i < 5; i++) {
    const candidate = generatePassword()
    const { data } = await supabase
      .from('games')
      .select('id')
      .eq('password', candidate)
      .neq('status', 'finished')
      .single()

    if (!data) {
      password = candidate
      break
    }
  }

  if (!password) redirect('/dashboard?error=password')

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      host_id: user.id,
      name,
      password,
      status: 'waiting',
      max_players: maxPlayers,
    })
    .select('id')
    .single()

  if (gameError || !game) redirect('/dashboard?error=create')

  redirect(`/game/${game.id}`)
}

export async function joinGameAsHost(gameId: string, nickname: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  const { data: player, error } = await supabase
    .from('players')
    .insert({ game_id: gameId, nickname, user_id: user.id })
    .select('id')
    .single()

  if (error || !player) return { error: '참여에 실패했습니다.' }

  revalidatePath(`/game/${gameId}`)
  return { success: true }
}
