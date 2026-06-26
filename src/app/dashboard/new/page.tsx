'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGame } from '@/app/actions/game'

export default function NewGamePage() {
  const router = useRouter()
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [isPending, startTransition] = useTransition()

  function addPlayer() {
    if (playerNames.length < 8) setPlayerNames(prev => [...prev, ''])
  }

  function removePlayer(index: number) {
    if (playerNames.length <= 2) return
    setPlayerNames(prev => prev.filter((_, i) => i !== index))
  }

  function updatePlayer(index: number, value: string) {
    setPlayerNames(prev => prev.map((name, i) => i === index ? value : name))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => { await createGame(formData) })
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-6">

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 active:text-white text-sm"
          >
            ← 뒤로
          </button>
          <h2 className="text-xl font-black text-white">새 게임 만들기</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm font-medium">게임 이름</label>
            <input
              type="text"
              name="name"
              placeholder="예: 보드게임 모임 1차"
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-gray-400 text-sm font-medium">플레이어</label>
              <span className="text-gray-600 text-xs">{playerNames.length}명</span>
            </div>

            {playerNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  name="players"
                  value={name}
                  onChange={e => updatePlayer(index, e.target.value)}
                  placeholder={`플레이어 ${index + 1}`}
                  required
                  maxLength={10}
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
                />
                {playerNames.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePlayer(index)}
                    className="px-3 text-gray-600 active:text-red-400 text-lg"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            {playerNames.length < 8 && (
              <button
                type="button"
                onClick={addPlayer}
                className="w-full py-3 bg-gray-900 border border-gray-800 border-dashed rounded-xl text-gray-600 active:text-gray-400 text-sm"
              >
                + 플레이어 추가
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 bg-violet-600 active:bg-violet-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl"
          >
            {isPending ? '생성 중...' : '게임 시작'}
          </button>

        </form>
      </div>
    </main>
  )
}
