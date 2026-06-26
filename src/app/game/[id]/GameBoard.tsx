'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Game, Player, RoundWithScores, PlayerStanding } from '@/lib/supabase/types'
import { joinGameAsHost } from '@/app/actions/game'
import { endGame } from '@/app/actions/round'
import ScoreInput from './ScoreInput'

function calculateStandings(players: Player[], rounds: RoundWithScores[]): PlayerStanding[] {
  return players
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
    .map((player, index) => ({ ...player, rank: index + 1 }))
}

interface Props {
  game: Game
  players: Player[]
  rounds: RoundWithScores[]
  isHost: boolean
  isHostJoined: boolean
}

export default function GameBoard({ game, players, rounds: initialRounds, isHost, isHostJoined }: Props) {
  const router = useRouter()
  const [rounds, setRounds] = useState(initialRounds)
  const [currentPlayers, setCurrentPlayers] = useState(players)
  const [copied, setCopied] = useState(false)
  const [hostNickname, setHostNickname] = useState('')
  const [joiningHost, setJoiningHost] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [gameStarted, setGameStarted] = useState(initialRounds.length > 0)
  const [checkingPlayers, setCheckingPlayers] = useState(false)
  const [awaitingChoice, setAwaitingChoice] = useState(false)
  const [ending, setEnding] = useState(false)

  const standings = calculateStandings(currentPlayers, rounds)
  const currentRound = rounds.length + 1
  const allPlayersJoined = currentPlayers.length >= game.max_players

  const fetchRounds = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('rounds')
      .select('*, scores(*)')
      .eq('game_id', game.id)
      .order('round_number')
    if (data) setRounds(data)
  }, [game.id])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`game:${game.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rounds',
        filter: `game_id=eq.${game.id}`,
      }, () => {
        fetchRounds()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [game.id, fetchRounds])

  async function handleHostJoin(e: React.FormEvent) {
    e.preventDefault()
    setJoinError('')
    setJoiningHost(true)
    const result = await joinGameAsHost(game.id, hostNickname)
    if (result.error) {
      setJoinError(result.error)
      setJoiningHost(false)
      return
    }
    router.refresh()
  }

  async function checkPlayers() {
    setCheckingPlayers(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at')
    if (data) setCurrentPlayers(data)
    setCheckingPlayers(false)
  }

  async function handleEndGame() {
    setEnding(true)
    const result = await endGame(game.id)
    if (result.error) {
      setEnding(false)
      return
    }
    router.push(`/game/${game.id}/result`)
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(game.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 진행자 닉네임 설정 화면
  if (isHost && !isHostJoined) {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-black text-white">
              Who<span className="text-violet-400">Wins</span>?
            </h1>
            <p className="text-gray-500 text-sm mt-2">게임에서 사용할 닉네임을 설정하세요</p>
          </div>

          <form onSubmit={handleHostJoin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="닉네임"
              value={hostNickname}
              onChange={e => setHostNickname(e.target.value)}
              maxLength={10}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-center text-lg"
            />
            {joinError && <p className="text-red-400 text-sm text-center">{joinError}</p>}
            <button
              type="submit"
              disabled={joiningHost}
              className="w-full py-4 bg-violet-600 active:bg-violet-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl"
            >
              {joiningHost ? '설정 중...' : '참여하기'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* 헤더 */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-xl font-black text-white">{game.name}</h1>
          <span className="text-xs text-gray-500">
            {rounds.length}라운드 완료
          </span>
        </div>

        {/* 비밀번호 공유 (진행자만) */}
        {isHost && (
          <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between border border-gray-800">
            <div>
              <p className="text-gray-500 text-xs mb-1">참여 비밀번호</p>
              <p className="text-white font-black text-2xl tracking-widest">{game.password}</p>
            </div>
            <button
              onClick={copyPassword}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                copied
                  ? 'bg-green-500/10 border-green-500 text-green-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 active:text-white'
              }`}
            >
              {copied ? '✓ 복사됨' : '복사'}
            </button>
          </div>
        )}

        {/* 대기 중 화면 (진행자, 라운드 미시작) */}
        {isHost && !gameStarted && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">참여자 현황</h2>
              <span className={`text-sm font-bold ${allPlayersJoined ? 'text-green-400' : 'text-gray-500'}`}>
                {currentPlayers.length} / {game.max_players}명
              </span>
            </div>

            {currentPlayers.length > 0 ? (
              <div className="flex flex-col gap-2">
                {currentPlayers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">{i + 1}.</span>
                    <span className="text-gray-300">{p.nickname}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm text-center py-2">아직 아무도 입장하지 않았습니다</p>
            )}

            {allPlayersJoined ? (
              <button
                onClick={() => setGameStarted(true)}
                className="w-full py-3 bg-green-600 active:bg-green-700 text-white font-bold rounded-xl"
              >
                라운드 시작하기
              </button>
            ) : (
              <button
                onClick={checkPlayers}
                disabled={checkingPlayers}
                className="w-full py-3 bg-gray-800 active:bg-gray-700 disabled:opacity-50 text-gray-300 font-bold rounded-xl border border-gray-700"
              >
                {checkingPlayers ? '확인 중...' : '참여자 확인'}
              </button>
            )}
          </div>
        )}

        {/* 참여자: 대기 중 화면 */}
        {!isHost && rounds.length === 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col gap-3 text-center">
            <p className="text-white font-bold">게임 시작 대기 중</p>
            <p className="text-gray-500 text-sm">진행자가 라운드를 시작하면 순위가 표시됩니다</p>
            {currentPlayers.length > 0 && (
              <div className="flex flex-col gap-1 mt-1 text-left">
                {currentPlayers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">{i + 1}.</span>
                    <span className="text-gray-300">{p.nickname}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 순위판 (라운드 시작 후) */}
        {(rounds.length > 0 || (isHost && gameStarted)) && (
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-400 text-sm font-medium">현재 순위</h2>
            {standings.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  index === 0 && rounds.length > 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-black w-6 text-center ${
                    index === 0 && rounds.length > 0 ? 'text-amber-400' : 'text-gray-600'
                  }`}>
                    {index === 0 && rounds.length > 0 ? '👑' : `${player.rank}`}
                  </span>
                  <span className="text-white font-medium">{player.nickname}</span>
                </div>
                <span className={`font-black text-lg ${
                  index === 0 && rounds.length > 0 ? 'text-amber-400' : 'text-white'
                }`}>
                  {player.totalScore}점
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 라운드 히스토리 */}
        {rounds.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-gray-400 text-sm font-medium">라운드 기록</h2>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div
                className="grid border-b border-gray-800 px-4 py-2"
                style={{ gridTemplateColumns: `80px repeat(${currentPlayers.length}, 1fr)` }}
              >
                <span className="text-gray-600 text-xs">라운드</span>
                {currentPlayers.map(p => (
                  <span key={p.id} className="text-gray-600 text-xs text-center truncate">{p.nickname}</span>
                ))}
              </div>
              {rounds.map(round => (
                <div
                  key={round.id}
                  className="grid border-b border-gray-800 last:border-0 px-4 py-3"
                  style={{ gridTemplateColumns: `80px repeat(${currentPlayers.length}, 1fr)` }}
                >
                  <span className="text-gray-400 text-sm">{round.round_number}R</span>
                  {currentPlayers.map(p => {
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

        {/* 진행자 컨트롤 (라운드 시작 후) */}
        {isHost && gameStarted && (
          awaitingChoice ? (
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
              players={currentPlayers}
              currentRound={currentRound}
              onSuccess={() => setAwaitingChoice(true)}
            />
          )
        )}

      </div>
    </main>
  )
}
