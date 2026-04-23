-- ============================================================
-- My TVShow — Schéma Supabase
-- À coller dans le SQL Editor de Supabase (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  bio text check (char_length(bio) <= 140),
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Lecture publique des profils
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles
  for select using (true);

-- Chacun peut créer son propre profil
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

-- Chacun peut modifier son propre profil
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- 2. TOP LISTS
-- ============================================================
create table if not exists public.top_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  position_1_tmdb_id int not null,
  position_2_tmdb_id int not null,
  position_3_tmdb_id int not null,
  comment text check (char_length(comment) <= 280),
  is_current boolean default true not null,
  created_at timestamptz default now() not null,
  -- Pas de doublons dans un même top
  check (position_1_tmdb_id <> position_2_tmdb_id
     and position_2_tmdb_id <> position_3_tmdb_id
     and position_1_tmdb_id <> position_3_tmdb_id)
);

create index if not exists top_lists_user_current_idx
  on public.top_lists(user_id) where is_current = true;

create index if not exists top_lists_created_at_idx
  on public.top_lists(created_at desc);

alter table public.top_lists enable row level security;

drop policy if exists "top_lists_read_all" on public.top_lists;
create policy "top_lists_read_all" on public.top_lists
  for select using (true);

drop policy if exists "top_lists_insert_self" on public.top_lists;
create policy "top_lists_insert_self" on public.top_lists
  for insert with check (auth.uid() = user_id);

drop policy if exists "top_lists_update_self" on public.top_lists;
create policy "top_lists_update_self" on public.top_lists
  for update using (auth.uid() = user_id);

drop policy if exists "top_lists_delete_self" on public.top_lists;
create policy "top_lists_delete_self" on public.top_lists
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 3. LIKES
-- ============================================================
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  top_list_id uuid not null references public.top_lists(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (user_id, top_list_id)
);

create index if not exists likes_top_list_idx on public.likes(top_list_id);

alter table public.likes enable row level security;

drop policy if exists "likes_read_all" on public.likes;
create policy "likes_read_all" on public.likes for select using (true);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self" on public.likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self" on public.likes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 4. FOLLOWS
-- ============================================================
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows(following_id);

alter table public.follows enable row level security;

drop policy if exists "follows_read_all" on public.follows;
create policy "follows_read_all" on public.follows for select using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows
  for insert with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows
  for delete using (auth.uid() = follower_id);

-- ============================================================
-- 5. VUES POUR LE FRONT
-- ============================================================

-- Vue du fil : top_list + username + like_count + liked_by_me
create or replace view public.top_lists_with_profile
with (security_invoker = true) as
select
  tl.id,
  tl.user_id,
  p.username,
  tl.position_1_tmdb_id,
  tl.position_2_tmdb_id,
  tl.position_3_tmdb_id,
  tl.comment,
  tl.is_current,
  tl.created_at,
  (select count(*) from public.likes l where l.top_list_id = tl.id) as like_count,
  exists(
    select 1 from public.likes l
    where l.top_list_id = tl.id and l.user_id = auth.uid()
  ) as liked_by_me
from public.top_lists tl
join public.profiles p on p.id = tl.user_id;

grant select on public.top_lists_with_profile to anon, authenticated;

-- Vue classement communautaire : séries les plus mentionnées dans les Top 3
-- Pondération : position 1 = 3 pts, position 2 = 2 pts, position 3 = 1 pt
-- Uniquement parmi les Top 3 actuels (is_current = true)
create or replace view public.community_trending
with (security_invoker = true) as
with mentions as (
  select position_1_tmdb_id as tmdb_id, 3 as weight from public.top_lists where is_current
  union all
  select position_2_tmdb_id, 2 from public.top_lists where is_current
  union all
  select position_3_tmdb_id, 1 from public.top_lists where is_current
)
select
  tmdb_id,
  count(*) as mentions,
  sum(weight) as weighted_score
from mentions
group by tmdb_id
order by weighted_score desc, mentions desc;

grant select on public.community_trending to anon, authenticated;

-- ============================================================
-- C'EST FINI !
-- ============================================================
-- Vérifie dans Table Editor que les 4 tables sont créées :
--   profiles, top_lists, likes, follows
-- Et dans Database > Views que tu as :
--   top_lists_with_profile, community_trending
-- ============================================================
