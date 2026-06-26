# WhoWins? — 프로젝트 계획서

보드게임 전용 점수판 웹앱. **한 명이 혼자 사용하는 단일 사용자 앱** — 게임 생성 시 플레이어 이름을 직접 입력하고, 라운드별 점수를 기록하며 최종 순위를 확인한다.

---

## 작업 환경

- **OS**: Windows 11
- **프로젝트 경로**: `D:\alfo\who-wins`
- **GitHub**: https://github.com/jjerry-o0o/who-wins.git
- **Git 계정**: jjerry-o0o / alfndp25@gmail.com (로컬 설정, 글로벌 아님)
- **Supabase 프로젝트 URL**: https://alllfvivqrmgzkeuktxn.supabase.co
- **배포**: Vercel (GitHub master 브랜치 push 시 자동 배포)
- **환경변수**: `.env.local` (gitignore 처리됨, 직접 입력 필요)

### 환경변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://alllfvivqrmgzkeuktxn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase Settings → API → anon public key>
```

---

## 작업 방식 (Claude와 협업 시)

- **파일 생성 전 코드 미리 보여주기** → 설명 → 사용자 확인 → 그 다음 실제 생성
- 파일 하나씩 순서대로 진행
- 커밋은 Phase 단위로, 메시지는 한국어로

---

## 기술 스택

| 역할 | 선택 | 비고 |
|------|------|------|
| 프레임워크 | Next.js (v16.2.9, App Router) | create-next-app으로 초기화 |
| 스타일링 | Tailwind CSS v4 | `@tailwindcss/postcss` 방식 (Vite 아님) |
| 백엔드/DB | Supabase (PostgreSQL) | Auth 미사용, anon 키로 직접 접근 |
| 언어 | TypeScript | |
| 배포 | Vercel | master push → 자동 배포 |

---

## 디자인 시스템

- **모바일 전용** (max-w-sm 기준)
- **다크 테마**: `bg-gray-950` 배경
- **주 색상**: violet-600 (버튼, 강조)
- **보조 색상**: amber/yellow (우승자 표시)
- **hover 대신 active**: 모바일은 마우스 오버 없으므로 `active:` 사용
- **폰트**: Geist Sans

---

## 앱 흐름

1. 랜딩 (`/`) → "새 게임 만들기" 또는 "게임 기록 보기"
2. 게임 생성 (`/dashboard/new`) → 게임명 + 플레이어 이름 입력 (2~8명)
3. 게임 화면 (`/game/[id]`) → 라운드 1부터 점수 입력 시작
4. 라운드 완료 후 → "라운드 추가" 또는 "게임 종료" 선택
5. 결과 화면 (`/game/[id]/result`) → 최종 순위 + 라운드 기록

---

## Supabase 스키마 (현재 DB 상태)

```sql
games (
  id uuid PK,
  name text,
  status text,               -- 'waiting' | 'playing' | 'finished'
  total_rounds int,          -- 미사용 (동적 라운드)
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz
)
-- 제거됨: host_id, password, max_players

players (
  id uuid PK,
  game_id uuid FK → games,
  nickname text,
  created_at timestamptz
)
-- 제거됨: user_id

rounds (
  id uuid PK,
  game_id uuid FK → rounds,
  round_number int,
  created_at timestamptz
)

scores (
  id uuid PK,
  round_id uuid FK → rounds,
  player_id uuid FK → players,
  score int
)
```

**RLS 정책**: 모든 테이블 `FOR ALL USING (true) WITH CHECK (true)` (anon 전체 허용)

---

## 현재 파일 구조

```
src/
  app/
    page.tsx                      # 랜딩 페이지 (새 게임 / 기록 보기)
    layout.tsx                    # 루트 레이아웃
    globals.css
    dashboard/
      page.tsx                    # 게임 목록
      new/page.tsx                # 게임 생성 (게임명 + 플레이어 이름 입력)
    game/[id]/
      page.tsx                    # 게임 메인 (Server Component)
      GameBoard.tsx               # 게임 보드 (Client Component)
      ScoreInput.tsx              # 라운드 점수 입력
      result/page.tsx             # 최종 결과 화면
    actions/
      game.ts                     # createGame (게임 + 플레이어 동시 생성)
      round.ts                    # submitRoundScores, endGame
  lib/
    supabase/
      client.ts                   # 브라우저용 Supabase 클라이언트
      server.ts                   # 서버용 Supabase 클라이언트
      types.ts                    # DB 타입 정의
    utils.ts                      # generateGameCode (미사용)
  proxy.ts                        # /dashboard 미들웨어 (Next.js 16: middleware.ts → proxy.ts), 현재는 pass-through만
next.config.ts                    # NODE_TLS_REJECT_UNAUTHORIZED=0 (dev only, Windows SSL 우회)
```

---

## 주요 트러블슈팅 기록

| 문제 | 원인 | 해결 |
|------|------|------|
| Build Error: Proxy is missing expected function export name | Next.js 16에서 middleware.ts 미지원 | proxy.ts로 파일명 변경, 함수명도 proxy로 변경 |
| SSL SELF_SIGNED_CERT_IN_CHAIN | Windows 개발 환경 Node.js SSL 이슈 | next.config.ts에서 dev 모드에만 NODE_TLS_REJECT_UNAUTHORIZED=0 |
| dashboard?error=create | DB 컬럼명 불일치 (password_hash vs password) | ALTER TABLE games RENAME COLUMN password_hash TO password |
| 회원가입 중복 이메일 오류 없음 | Supabase signUp 200 반환 + session:null | data.session null 체크로 분기 처리 |
| 새 게임 생성 시 404 | proxy.ts 미들웨어가 /dashboard 진입 시 /auth/login으로 리다이렉트, 해당 페이지 삭제됨 | proxy.ts를 pass-through로 변경 |
| cannot drop column host_id | host_id에 의존하는 RLS 정책이 존재 | 의존 정책 먼저 DROP 후 컬럼 제거 |

---

## 작업 순서 (Phase)

### Phase 1 — 환경 세팅 ✅
- [x] Next.js 프로젝트 초기화 (TypeScript + Tailwind + App Router)
- [x] Supabase 클라이언트 라이브러리 설치 및 환경변수 설정
- [x] Supabase 스키마 SQL 작성 및 실행

### Phase 2 — 인증 & 입장 ✅ (이후 제거됨)
- [x] Supabase 클라이언트 유틸 (client.ts, server.ts, types.ts)
- [x] 인증 미들웨어 (proxy.ts)
- [x] 랜딩 페이지, 로그인/회원가입, 비밀번호 재설정, 참여자 입장 화면

### Phase 3 — 게임 생성 ✅
- [x] 진행자 대시보드, 게임 생성 폼

### Phase 4 — 게임 진행 ✅
- [x] 게임 메인 화면, 라운드 점수 입력, 라운드 추가/종료, Supabase Realtime

### Phase 5 — 결과 화면 ✅
- [x] 최종 결과 페이지, 순위, 라운드 기록

### Phase 6 — 단일 사용자 앱으로 전환 + 배포 ✅
- [x] 인증(로그인/회원가입) 전면 제거
- [x] 게임 생성 시 플레이어 이름 직접 입력으로 변경 (2~8명)
- [x] 참여 코드/비밀번호 시스템 제거
- [x] Realtime 구독 제거 (단일 사용자이므로 불필요)
- [x] 동점자 순위 처리 (1,1,3 방식, 동점 1위 다수 표시)
- [x] Supabase DB 스키마 변경 (host_id, password, max_players, user_id 제거)
- [x] RLS 정책 anon 전체 허용으로 변경
- [x] Vercel 배포 (GitHub master push → 자동 배포)
