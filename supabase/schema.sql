-- WhoWins? Supabase Schema
-- Supabase SQL Editor에 전체 붙여넣고 실행

-- ===========================
-- 1. GAMES
-- ===========================
create table public.games (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  password_hash text not null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  total_rounds int not null default 1,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

-- ===========================
-- 2. PLAYERS
-- ===========================
create table public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  nickname text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ===========================
-- 3. ROUNDS
-- ===========================
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  round_number int not null,
  created_at timestamptz not null default now(),
  unique(game_id, round_number)
);

-- ===========================
-- 4. SCORES
-- ===========================
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  score int not null default 0,
  unique(round_id, player_id)
);

-- ===========================
-- 5. COMMENTS (게임 종료 소감)
-- ===========================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  unique(game_id, player_id)
);

-- ===========================
-- 6. RLS (Row Level Security)
-- ===========================
alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.rounds enable row level security;
alter table public.scores enable row level security;
alter table public.comments enable row level security;

-- games: 누구나 조회 가능, 호스트만 생성/수정
create policy "games_select" on public.games for select using (true);
create policy "games_insert" on public.games for insert with check (auth.uid() = host_id);
create policy "games_update" on public.games for update using (auth.uid() = host_id);
create policy "games_delete" on public.games for delete using (auth.uid() = host_id);

-- players: 누구나 조회 가능, 인증된 사용자 삽입 가능
create policy "players_select" on public.players for select using (true);
create policy "players_insert" on public.players for insert with check (true);
create policy "players_update" on public.players for update using (true);

-- rounds: 누구나 조회, 호스트만 생성
create policy "rounds_select" on public.rounds for select using (true);
create policy "rounds_insert" on public.rounds for insert with check (
  exists (select 1 from public.games where id = game_id and host_id = auth.uid())
);

-- scores: 누구나 조회, 호스트만 입력
create policy "scores_select" on public.scores for select using (true);
create policy "scores_insert" on public.scores for insert with check (
  exists (
    select 1 from public.rounds r
    join public.games g on g.id = r.game_id
    where r.id = round_id and g.host_id = auth.uid()
  )
);
create policy "scores_update" on public.scores for update using (
  exists (
    select 1 from public.rounds r
    join public.games g on g.id = r.game_id
    where r.id = round_id and g.host_id = auth.uid()
  )
);

-- comments: 누구나 조회, 본인만 작성
create policy "comments_select" on public.comments for select using (true);
create policy "comments_insert" on public.comments for insert with check (true);
create policy "comments_update" on public.comments for update using (true);

-- ===========================
-- 7. REALTIME 활성화
-- ===========================
-- Supabase 대시보드 → Database → Replication 에서
-- games, rounds, scores, players, comments 테이블 모두 체크

-- ===========================
-- 8. 누적 점수 뷰 (편의용)
-- ===========================
create or replace view public.player_totals as
select
  p.id as player_id,
  p.game_id,
  p.nickname,
  coalesce(sum(s.score), 0) as total_score,
  rank() over (partition by p.game_id order by coalesce(sum(s.score), 0) desc) as rank
from public.players p
left join public.scores s on s.player_id = p.id
group by p.id, p.game_id, p.nickname;
