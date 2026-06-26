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
            href="/auth/login"
            className="w-full py-4 bg-violet-600 active:bg-violet-700 text-white font-bold text-lg rounded-2xl text-center"
          >
            진행자로 시작
          </Link>
          <Link
            href="/join"
            className="w-full py-4 bg-gray-800 active:bg-gray-700 text-white font-bold text-lg rounded-2xl text-center border border-gray-700"
          >
            참여자로 입장
          </Link>
        </div>

        <p className="text-gray-600 text-xs text-center leading-relaxed">
          진행자: 게임 생성 및 점수 입력<br />
          참여자: 비밀번호로 입장 후 점수 확인
        </p>

      </div>
    </main>
  )
}
