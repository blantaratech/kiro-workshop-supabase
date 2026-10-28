-- Kiro 101 — Supabase edition 1.0.0
-- Run this whole file in SQL Editor on your NEW workshop project.
-- Re-running it refreshes functions/policies and preserves existing data.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 64),
  bio text not null default '' check (char_length(bio) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 280 and content ~ '[^[:space:]]'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  primary key (user_id, post_id)
);
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists posts_created_idx on public.posts(created_at desc, id desc);
create index if not exists posts_user_idx on public.posts(user_id, created_at desc);
create index if not exists likes_post_idx on public.likes(post_id);
create index if not exists follows_followee_idx on public.follows(followee_id);

-- Only the Auth signup trigger creates profiles. Emails stay in Supabase Auth.
create or replace function public.handle_workshop_signup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, username, display_name)
  values (
    new.id,
    lower(btrim(coalesce(nullif(new.raw_user_meta_data->>'username',''),
      'user_' || substr(replace(new.id::text,'-',''),1,19)))),
    btrim(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Student'))
  );
  return new;
end;
$$;
revoke all on function public.handle_workshop_signup() from public, anon, authenticated;
drop trigger if exists on_workshop_user_created on auth.users;
create trigger on_workshop_user_created after insert on auth.users
  for each row execute function public.handle_workshop_signup();

create or replace function public.workshop_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.workshop_updated_at() from public, anon, authenticated;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.workshop_updated_at();
drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts
  for each row execute function public.workshop_updated_at();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;
grant usage on schema public to anon, authenticated;
revoke all on public.profiles, public.posts, public.likes, public.follows from public, anon, authenticated;
grant select on public.profiles, public.posts, public.likes, public.follows to authenticated;
grant update(display_name,bio) on public.profiles to authenticated;
grant insert(user_id,content), update(content), delete on public.posts to authenticated;
grant insert(user_id,post_id), delete on public.likes to authenticated;
grant insert(follower_id,followee_id), delete on public.follows to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists profiles_edit_own on public.profiles;
create policy profiles_edit_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists posts_create_own on public.posts;
create policy posts_create_own on public.posts for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists posts_edit_own on public.posts;
create policy posts_edit_own on public.posts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists likes_create_own on public.likes;
create policy likes_create_own on public.likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists follows_read on public.follows;
create policy follows_read on public.follows for select to authenticated using ((select auth.uid()) is not null);
drop policy if exists follows_create_own on public.follows;
create policy follows_create_own on public.follows for insert to authenticated with check (follower_id = (select auth.uid()));
drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

-- These functions execute as the caller, so table grants and RLS still apply.
create or replace function public.get_profiles(target_ids uuid[])
returns table(id uuid, username text, display_name text, bio text, created_at timestamptz,
  updated_at timestamptz, followers_count bigint, following_count bigint)
language sql stable security invoker set search_path = '' as $$
  select p.id,p.username,p.display_name,p.bio,p.created_at,p.updated_at,
    (select count(*) from public.follows f where f.followee_id=p.id),
    (select count(*) from public.follows f where f.follower_id=p.id)
  from public.profiles p where p.id=any(target_ids);
$$;
revoke all on function public.get_profiles(uuid[]) from public, anon, authenticated;
grant execute on function public.get_profiles(uuid[]) to authenticated;

create or replace function public.list_posts(
  page_size integer default 10, page_offset integer default 0,
  sort_by text default 'newest', author_id uuid default null)
returns table(id uuid,user_id uuid,content text,created_at timestamptz,updated_at timestamptz,likes_count bigint,liked boolean)
language sql stable security invoker set search_path = '' as $$
  with feed as (
    select p.*,(select count(*) from public.likes l where l.post_id=p.id) as n,
      exists(select 1 from public.likes l where l.post_id=p.id and l.user_id=(select auth.uid())) as mine
    from public.posts p where author_id is null or p.user_id=author_id
  )
  select f.id,f.user_id,f.content,f.created_at,f.updated_at,f.n,f.mine from feed f
  order by case when sort_by='popular' then f.n else 0 end desc, f.created_at desc, f.id desc
  limit greatest(1,least(51,coalesce(page_size,10)))
  offset greatest(0,least(1000000,coalesce(page_offset,0)));
$$;
revoke all on function public.list_posts(integer,integer,text,uuid) from public, anon, authenticated;
grant execute on function public.list_posts(integer,integer,text,uuid) to authenticated;

-- Safe before login: reports the kit version, not any student data.
create or replace function public.workshop_status() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('version','1.0.0','backend','supabase');
$$;
revoke all on function public.workshop_status() from public, anon, authenticated;
grant execute on function public.workshop_status() to anon, authenticated;
commit;
