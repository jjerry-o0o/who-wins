# WhoWins? — 프로젝트 계획서

보드게임 전용 점수판 웹앱. 진행자가 게임을 생성하고 참여자들이 비밀번호로 입장해 실시간으로 점수를 확인하는 모바일 우선 서비스.

---

## 작업 환경

- **OS**: Windows 11
- **프로젝트 경로**: `D:\alfo\who-wins`
- **GitHub**: https://github.com/jjerry-o0o/who-wins.git
- **Git 계정**: jjerry-o0o / alfndp25@gmail.com (로컬 설정, 글로벌 아님)
- **Supabase 프로젝트 URL**: https://alllfvivqrmgzkeuktxn.supabase.co
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
| 백엔드/DB | Supabase (Auth + PostgreSQL + Realtime) | |
| 언어 | TypeScript | |
| 배포 | Vercel | Phase 6 진행 중 |

---

## 디자인 시스템

- **모바일 전용** (max-w-sm 기준)
- **다크 테마**: `bg-gray-950` 배경
- **주 색상**: violet-600 (버튼, 강조)
- **보조 색상**: amber/yellow (우승자 표시)
- **hover 대신 active**: 모바일은 마우스 오버 없으므로 `active:` 사용
- **폰트**: Geist Sans

---

## 사용자 역할

### 진행자 (Host)
- Supabase Auth 이메일 로그인 필요
- 새 게임 생성, 참여자 입장 확인, 라운드 점수 입력, 라운드 추가/종료

### 참여자 (Participant)
- 6자리 비밀번호만으로 입장 (게임 코드 없음)
- 닉네임 설정 후 players 테이블에 등록
- 세션은 localStorage에 저장 (`player_session` 키)
- 실시간 순위판 및 라운드 기록 조회 가능

---

## 게임 흐름

1. 진행자 게임 생성 → 비밀번호 서버 생성 (6자리, 활성 게임 중복 체크)
2. 진행자 닉네임 설정 (players 테이블에 host로 등록)
3. 비밀번호 공유 → 참여자 입장 (`/join`)
4. "참여자 확인" 버튼으로 입장 인원 확인 → max_players 충족 시 "라운드 시작" 활성화
5. 라운드 점수 입력 → 완료 후 "라운드 추가" 또는 "게임 종료" 선택
6. 결과 페이지 (`/game/[id]/result`)

---

## Supabase 스키마 (실제 DB 상태)

> `supabase/schema.sql` 파일 참고. 이후 ALTER TABLE로 변경된 내용 반영됨.

```sql
games (
  id uuid PK,
  host_id uuid FK → auth.users,
  name text,
  password text,             -- 6자리 참여 비밀번호 (서버 생성, 평문)
  status text,               -- 'waiting' | 'playing' | 'finished'
  total_rounds int,          -- 현재 미사용 (동적 라운드로 변경됨)
  max_players int,           -- 최대 참여 인원
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz
)
-- 주의: code 컬럼은 DROP됨, password_hash → password로 RENAME됨

players (
  id uuid PK,
  game_id uuid FK → games,
  nickname text,
  user_id uuid nullable FK → auth.users,  -- 진행자는 값 있음, 참여자는 null
  created_at timestamptz
)

rounds (
  id uuid PK,
  game_id uuid FK → games,
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

> **Realtime 활성화 필요**: Supabase → Database → Replication에서 games, players, rounds, scores 체크

---

## 현재 파일 구조

```
src/
  app/
    page.tsx                      # 랜딩 페이지
    layout.tsx                    # 루트 레이아웃
    globals.css
    auth/
      login/page.tsx              # 진행자 로그인/회원가입 (탭 전환)
      reset/page.tsx              # 비밀번호 재설정 이메일 발송
      update-password/page.tsx    # 새 비밀번호 입력
      callback/route.ts           # Supabase Auth 콜백
    join/
      page.tsx                    # 참여자 입장 (비밀번호 → 닉네임)
    dashboard/
      page.tsx                    # 진행자 홈 (게임 목록)
      new/page.tsx                # 게임 생성 폼
    game/[id]/
      page.tsx                    # 게임 메인 (Server Component)
      GameBoard.tsx               # 게임 보드 (Client, Realtime)
      ScoreInput.tsx              # 라운드 점수 입력
      result/page.tsx             # 최종 결과 화면
    actions/
      game.ts                     # createGame, joinGameAsHost
      round.ts                    # submitRoundScores, endGame
  lib/
    supabase/
      client.ts                   # 브라우저용 Supabase 클라이언트
      server.ts                   # 서버용 Supabase 클라이언트
      types.ts                    # DB 타입 정의
    utils.ts                      # generatePassword (6자리 코드 생성)
  proxy.ts                        # /dashboard 보호 미들웨어 (Next.js 16: middleware.ts → proxy.ts)
supabase/
  schema.sql                      # DB 스키마 전체 (초기 버전)
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

---

## 작업 순서 (Phase)

### Phase 1 — 환경 세팅 ✅
- [x] Next.js 프로젝트 초기화 (TypeScript + Tailwind + App Router)
- [x] Supabase 클라이언트 라이브러리 설치 및 환경변수 설정
- [x] Supabase 스키마 SQL 작성 및 실행

### Phase 2 — 인증 & 입장 ✅
- [x] Supabase 클라이언트 유틸 (client.ts, server.ts, types.ts)
- [x] 인증 미들웨어 (proxy.ts)
- [x] 랜딩 페이지 (/)
- [x] 진행자 로그인/회원가입 (/auth/login)
- [x] 비밀번호 재설정 (/auth/reset, /auth/update-password)
- [x] 참여자 입장 화면 (/join) — 비밀번호 + 닉네임

### Phase 3 — 게임 생성 ✅
- [x] 진행자 대시보드 (/dashboard)
- [x] 게임 생성 폼 (이름, 플레이어 수)
- [x] 비밀번호 서버 생성 + 중복 체크 (Server Action)

### Phase 4 — 게임 진행 ✅
- [x] 게임 메인 화면 (/game/[id])
- [x] 진행자 닉네임 설정 (players 테이블 등록)
- [x] 참여자 확인 버튼 → 라운드 시작 활성화
- [x] 라운드 점수 입력 (진행자만)
- [x] 라운드 추가 / 게임 종료 선택
- [x] Supabase Realtime 구독 (점수 실시간 갱신)
- [x] 참여자 대기 중 화면

### Phase 5 — 결과 화면 ✅
- [x] 최종 결과 페이지 (/game/[id]/result)
- [x] 1위 트로피 하이라이트
- [x] 전체 순위 (메달 표시)
- [x] 라운드별 점수 기록 테이블

### Phase 6 — 배포 ← 현재 단계
- [ ] Vercel 배포 (환경변수 설정)
- [ ] Supabase Auth URL 설정 (Site URL, Redirect URLs → Vercel URL)
- [ ] RLS 정책 확인 (참여자 anon INSERT 허용 여부)
