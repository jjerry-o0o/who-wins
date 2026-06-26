'use client'

import { useRouter } from 'next/navigation'
import { createGame } from '@/app/actions/game'

export default function NewGamePage() {
  const router = useRouter()

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

        <form action={createGame} className="flex flex-col gap-6">

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

          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm font-medium">총 라운드 수</label>
            <input
              type="number"
              name="totalRounds"
              min={1}
              max={20}
              defaultValue={5}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-sm font-medium">플레이어 수</label>
            <input
              type="number"
              name="maxPlayers"
              min={2}
              max={10}
              defaultValue={4}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-violet-600 active:bg-violet-700 text-white font-bold text-lg rounded-2xl"
          >
            게임 시작
          </button>

        </form>
      </div>
    </main>
  )
}
