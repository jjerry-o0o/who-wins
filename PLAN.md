# WhoWins? — 프로젝트 계획서

보드게임 전용 점수판 웹앱. 진행자가 게임을 생성하고 참여자들이 비밀번호로 입장해 실시간으로 점수를 확인하는 모바일 우선 서비스.

---

## 기술 스택

| 역할 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 스타일링 | Tailwind CSS |
| 백엔드/DB | Supabase (Auth + PostgreSQL + Realtime) |
| 배포 | Vercel |

> localStorage 대신 Supabase를 선택한 이유: 참여자들이 동일한 게임을 실시간으로 공유해야 하므로 서버 DB + Realtime 구독이 필수.

---

## 사용자 역할

### 진행자 (Host)
- 이메일/소셜 로그인 필요 (Supabase Auth)
- 새 게임 생성, 플레이어 추가, 라운드 점수 입력 가능
- 게임 공유용 비밀번호 설정

### 참여자 (Participant)
- 진행자가 공유한 비밀번호로 입장
- 점수 확인 및 라운드 히스토리 조회
- 닉네임 설정, 게임 종료 후 소감 작성

---

## 핵심 기능

1. **게임 생성** — 게임 이름, 플레이어 이름(2명 이상), 라운드 수 설정
2. **라운드 점수 입력** — 매 라운드 종료 후 진행자가 플레이어별 점수 입력
3. **실시간 순위** — 누적 점수 기반 순위, Supabase Realtime으로 자동 갱신
4. **라운드 히스토리** — 라운드별 점수 기록 조회
5. **게임 종료 결과** — 최종 순위, 게임 시간, 라운드별 점수, 소감 한 줄
6. **공유 기능** — 최종 결과 화면 URL 공유 가능

---

## 화면 구성

```
/ (랜딩)
  ├── 진행자로 시작 → /auth (로그인/회원가입)
  └── 참여자로 입장 → /join (비밀번호 입력)

/dashboard (진행자 홈)
  ├── 새 게임 만들기
  └── 이전 게임 목록

/game/[id] (게임 메인)
  ├── 현재 순위판
  ├── 라운드 점수 입력 (진행자만)
  └── 라운드 히스토리

/game/[id]/result (최종 결과)
  ├── 우승자 크게 표시
  ├── 전체 순위
  ├── 라운드별 점수표
  ├── 게임 시간
  └── 참여자 소감 목록
```

---

## Supabase 스키마

```sql
-- 게임
games (
  id uuid PK,
  host_id uuid FK → auth.users,
  name text,
  password_hash text,
  status text,  -- 'waiting' | 'playing' | 'finished'
  total_rounds int,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz
)

-- 플레이어 (진행자 추가 or 참여자 본인)
players (
  id uuid PK,
  game_id uuid FK → games,
  nickname text,
  user_id uuid nullable FK → auth.users,
  created_at timestamptz
)

-- 라운드
rounds (
  id uuid PK,
  game_id uuid FK → games,
  round_number int,
  created_at timestamptz
)

-- 점수
scores (
  id uuid PK,
  round_id uuid FK → rounds,
  player_id uuid FK → players,
  score int
)

-- 소감
comments (
  id uuid PK,
  game_id uuid FK → games,
  player_id uuid FK → players,
  content text,
  created_at timestamptz
)
```

---

## 작업 순서 (Phase)

### Phase 1 — 환경 세팅
- [x] 프로젝트 계획서 작성 (이 파일)
- [ ] Next.js 14 프로젝트 초기화
- [ ] Tailwind CSS 설정
- [ ] Supabase 프로젝트 생성 및 환경변수 설정
- [ ] Supabase 스키마 마이그레이션

### Phase 2 — 인증 & 입장
- [ ] 진행자 로그인/회원가입 화면
- [ ] 참여자 비밀번호 입장 화면
- [ ] 닉네임 설정

### Phase 3 — 게임 생성
- [ ] 게임 생성 폼 (이름, 플레이어, 라운드 수)
- [ ] 게임 공유 비밀번호 생성

### Phase 4 — 게임 진행
- [ ] 게임 메인 화면 (실시간 순위판)
- [ ] 라운드 점수 입력 UI (진행자)
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

---

## 환경변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
