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
| 배포 | Vercel (예정) | |

---

## 디자인 시스템

- **모바일 전용** (max-w-sm 기준)
- **다크 테마**: `bg-gray-950` 배경
- **주 색상**: violet-600 (버튼, 강조)
- **보조 색상**: amber/yellow (우승자 표시 예정)
- **hover 대신 active**: 모바일은 마우스 오버 없으므로 `active:` 사용
- **폰트**: Geist Sans

---

## 사용자 역할

### 진행자 (Host)
- Supabase Auth 이메일 로그인 필요
- 새 게임 생성, 플레이어 추가, 라운드 점수 입력 가능
- 게임 공유용 코드 + 비밀번호 설정

### 참여자 (Participant)
- 게임 코드(6자리) + 비밀번호로 입장
- 세션은 localStorage에 저장 (`player_session` 키)
- 점수 확인, 라운드 히스토리 조회, 게임 종료 후 소감 작성

---

## 핵심 기능

1. **게임 생성** — 게임 이름, 플레이어 이름(2명 이상), 라운드 수 설정
2. **라운드 점수 입력** — 매 라운드 종료 후 진행자가 플레이어별 점수 입력
3. **실시간 순위** — 누적 점수 기반 순위, Supabase Realtime으로 자동 갱신
4. **라운드 히스토리** — 라운드별 점수 기록 조회
5. **게임 종료 결과** — 최종 순위, 게임 시간, 라운드별 점수, 소감 한 줄
6. **공유 기능** — 최종 결과 화면 URL 공유 가능

---

## 화면 구성 및 라우트

```
/ (랜딩)
  ├── 진행자로 시작 → /auth/login
  └── 참여자로 입장 → /join

/auth/login (진행자 로그인/회원가입)
  └── 로그인/회원가입 탭 전환, Supabase Auth 이메일 방식

/join (참여자 입장)
  ├── Step 1: 게임 코드(6자리) + 비밀번호 입력
  └── Step 2: 닉네임 설정 → localStorage에 player_session 저장

/dashboard (진행자 홈) ← 미들웨어로 비로그인 시 /auth/login 리다이렉트
  ├── 새 게임 만들기
  └── 이전 게임 목록

/game/[id] (게임 메인)
  ├── 현재 순위판 (Realtime)
  ├── 라운드 점수 입력 (진행자만)
  └── 라운드 히스토리

/game/[id]/result (최종 결과)
  ├── 우승자 크게 표시
  ├── 전체 순위
  ├── 라운드별 점수표
  ├── 게임 시간
  └── 참여자 소감 목록 (공유 가능)
```

---

## Supabase 스키마

> `supabase/schema.sql` 파일에 전체 SQL 있음. Supabase SQL Editor에서 실행.

```sql
games (
  id uuid PK,
  host_id uuid FK → auth.users,
  name text,
  code text UNIQUE,          -- 6자리 참여 코드 (예: AB12CD), Phase 3에서 추가
  password text,             -- 참여 비밀번호 (평문)
  status text,               -- 'waiting' | 'playing' | 'finished'
  total_rounds int,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz
)

players (
  id uuid PK,
  game_id uuid FK → games,
  nickname text,
  user_id uuid nullable FK → auth.users,
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

comments (
  id uuid PK,
  game_id uuid FK → games,
  player_id uuid FK → players,
  content text,
  created_at timestamptz
)
```

> **주의**: 현재 `schema.sql`의 `games` 테이블에는 `code` 컬럼이 없음. Phase 3에서 아래 SQL로 추가 필요:
> ```sql
> ALTER TABLE public.games ADD COLUMN code text UNIQUE;
> ```

---

## 현재 파일 구조

```
src/
  app/
    page.tsx               # 랜딩 페이지
    layout.tsx             # 루트 레이아웃 (viewport 모바일 설정 포함)
    globals.css
    auth/
      login/
        page.tsx           # 진행자 로그인/회원가입
    join/
      page.tsx             # 참여자 입장 (게임 코드 + 비밀번호 + 닉네임)
  lib/
    supabase/
      client.ts            # 브라우저용 Supabase 클라이언트
      server.ts            # 서버용 Supabase 클라이언트
      types.ts             # DB 타입 정의 + PlayerSession 타입
  middleware.ts            # /dashboard 보호 (비로그인 → /auth/login)
supabase/
  schema.sql               # DB 스키마 전체
```

---

## 작업 순서 (Phase)

### Phase 1 — 환경 세팅
- [x] 프로젝트 계획서 작성
- [x] Next.js 프로젝트 초기화 (TypeScript + Tailwind + App Router)
- [x] Supabase 클라이언트 라이브러리 설치
- [x] Supabase 프로젝트 생성 및 환경변수 설정
- [x] Supabase 스키마 SQL 작성 및 실행

### Phase 2 — 인증 & 입장 ✅
- [x] Supabase 클라이언트 유틸 (`client.ts`, `server.ts`, `types.ts`)
- [x] 인증 미들웨어 (`middleware.ts`)
- [x] 랜딩 페이지 (`/`)
- [x] 진행자 로그인/회원가입 (`/auth/login`)
- [x] 참여자 입장 화면 (`/join`) — 게임 코드 + 비밀번호 + 닉네임

### Phase 3 — 게임 생성 ← 현재 단계
- [ ] `games` 테이블에 `code` 컬럼 추가 (Supabase SQL Editor)
- [ ] `/dashboard` — 진행자 홈 (새 게임 만들기 + 이전 게임 목록)
- [ ] 게임 생성 폼 (게임 이름, 플레이어 이름, 라운드 수)
- [ ] 6자리 게임 코드 자동 생성 로직
- [ ] 게임 비밀번호 설정
- [ ] `games` + `players` 테이블 저장 후 `/game/[id]`로 이동

### Phase 4 — 게임 진행
- [ ] 게임 메인 화면 (`/game/[id]`) — 실시간 순위판
- [ ] 라운드 점수 입력 UI (진행자만)
- [ ] Supabase Realtime 구독으로 실시간 갱신
- [ ] 라운드 히스토리 뷰

### Phase 5 — 결과 화면
- [ ] 게임 종료 트리거 (진행자)
- [ ] 소감 입력 화면
- [ ] 최종 결과 화면 (우승자, 순위, 점수표, 소감)
- [ ] 공유 URL 생성

### Phase 6 — 폴리싱 & 배포
- [ ] 게임스러운 UI 애니메이션 (순위 변동 효과 등)
- [ ] 반응형 모바일 최적화
- [ ] Vercel 배포
