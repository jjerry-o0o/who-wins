import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">

        <div className="text-center">
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-5xl font-black text-white tracking-tight">
            Who<span className="text-violet-400">Wins</span>?
          </h1>
          <p className="text-gray-500 mt-2 text-sm">보드게임 점수판</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Link
            href="/dashboard/new"
            className="w-full py-4 bg-violet-600 active:bg-violet-700 text-white font-bold text-lg rounded-2xl text-center"
          >
            새 게임 만들기
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-4 bg-gray-800 active:bg-gray-700 text-white font-bold text-lg rounded-2xl text-center border border-gray-700"
          >
            게임 기록 보기
          </Link>
        </div>

      </div>
    </main>
  )
}
