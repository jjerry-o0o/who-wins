export type GameStatus = 'waiting' | 'playing' | 'finished'

export interface Game {
  id: string
  name: string
  status: GameStatus
  total_rounds: number
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface Player {
  id: string
  game_id: string
  nickname: string
  created_at: string
}

export interface Round {
  id: string
  game_id: string
  round_number: number
  created_at: string
}

export interface Score {
  id: string
  round_id: string
  player_id: string
  score: number
}

export interface RoundWithScores extends Round {
  scores: Score[]
}

export interface PlayerStanding {
  id: string
  nickname: string
  totalScore: number
  rank: number
}
