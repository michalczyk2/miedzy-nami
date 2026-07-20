-- Między Nami v0.9.1
-- Dopasowanie 18+ na dwóch telefonach: wspólna sesja, ukryte odpowiedzi i wynik po ukończeniu przez oboje.

create table if not exists public.multiplayer_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  game_key text not null check (game_key in ('spicy_match')),
  question_ids text[] not null,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours'),
  check (cardinality(question_ids) = 8)
);

create table if not exists public.multiplayer_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.multiplayer_sessions(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers smallint[] not null,
  completed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (session_id, user_id),
  check (cardinality(answers) = 8),
  check (answers <@ array[0,1,2,3]::smallint[])
);

create index if not exists multiplayer_sessions_couple_status_idx
  on public.multiplayer_sessions(couple_id, game_key, status, created_at desc);
create index if not exists multiplayer_submissions_session_idx
  on public.multiplayer_submissions(session_id, completed_at);

create or replace function public.multiplayer_both_submissions_present(target_session uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) = 2
  from public.multiplayer_submissions
  where session_id = target_session;
$$;

create or replace function public.refresh_multiplayer_session_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.multiplayer_both_submissions_present(new.session_id) then
    update public.multiplayer_sessions
    set status = 'completed',
        completed_at = coalesce(completed_at, timezone('utc', now())),
        updated_at = timezone('utc', now())
    where id = new.session_id and status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists multiplayer_submission_refresh_status on public.multiplayer_submissions;
create trigger multiplayer_submission_refresh_status
after insert or update on public.multiplayer_submissions
for each row execute function public.refresh_multiplayer_session_status();

create or replace function public.create_spicy_match_session(p_question_ids text[])
returns table(
  session_id uuid,
  couple_id uuid,
  game_key text,
  question_ids text[],
  status text,
  created_by uuid,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_couple uuid;
  member_count integer;
  created public.multiplayer_sessions;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if cardinality(p_question_ids) <> 8 then raise exception 'INVALID_QUESTION_COUNT'; end if;
  if exists(select 1 from unnest(p_question_ids) item where item is null or btrim(item) = '') then
    raise exception 'INVALID_QUESTION_IDS';
  end if;

  select cm.couple_id into target_couple
  from public.couple_members cm
  where cm.user_id = auth.uid();
  if target_couple is null then raise exception 'COUPLE_REQUIRED'; end if;

  select count(*) into member_count
  from public.couple_members cm
  where cm.couple_id = target_couple;
  if member_count <> 2 then raise exception 'PARTNER_REQUIRED'; end if;

  -- Prywatność: rozpoczęcie nowej rundy usuwa poprzedni wynik i odpowiedzi tej gry.
  delete from public.multiplayer_sessions
  where multiplayer_sessions.couple_id = target_couple
    and multiplayer_sessions.game_key = 'spicy_match';

  insert into public.multiplayer_sessions(couple_id, game_key, question_ids, created_by)
  values(target_couple, 'spicy_match', p_question_ids, auth.uid())
  returning * into created;

  return query
  select created.id, created.couple_id, created.game_key, created.question_ids,
         created.status, created.created_by, created.created_at, created.expires_at;
end;
$$;

create or replace function public.submit_spicy_match_session(p_session_id uuid, p_answers smallint[])
returns table(session_id uuid, status text, completed_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.multiplayer_sessions;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if cardinality(p_answers) <> 8 then raise exception 'INVALID_ANSWER_COUNT'; end if;
  if not (p_answers <@ array[0,1,2,3]::smallint[]) then raise exception 'INVALID_ANSWERS'; end if;

  select * into target
  from public.multiplayer_sessions s
  where s.id = p_session_id
  for update;

  if target.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
  if target.status <> 'active' then raise exception 'SESSION_NOT_ACTIVE'; end if;
  if target.expires_at <= timezone('utc', now()) then raise exception 'SESSION_EXPIRED'; end if;
  if not public.is_couple_member(target.couple_id, auth.uid()) then raise exception 'NOT_A_COUPLE_MEMBER'; end if;

  insert into public.multiplayer_submissions(session_id, couple_id, user_id, answers)
  values(target.id, target.couple_id, auth.uid(), p_answers)
  on conflict (session_id, user_id)
  do update set answers = excluded.answers,
                completed_at = timezone('utc', now()),
                updated_at = timezone('utc', now());

  return query
  select s.id, s.status, s.completed_at
  from public.multiplayer_sessions s
  where s.id = target.id;
end;
$$;

create or replace function public.cancel_spicy_match_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.multiplayer_sessions;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into target from public.multiplayer_sessions where id = p_session_id for update;
  if target.id is null then return; end if;
  if not public.is_couple_member(target.couple_id, auth.uid()) then raise exception 'NOT_A_COUPLE_MEMBER'; end if;
  delete from public.multiplayer_sessions where id = target.id;
end;
$$;

alter table public.multiplayer_sessions enable row level security;
alter table public.multiplayer_submissions enable row level security;
alter table public.multiplayer_sessions replica identity full;
alter table public.multiplayer_submissions replica identity full;

drop policy if exists multiplayer_sessions_select_member on public.multiplayer_sessions;
create policy multiplayer_sessions_select_member
on public.multiplayer_sessions for select
using (
  public.is_couple_member(couple_id)
  and expires_at > timezone('utc', now())
);

drop policy if exists multiplayer_submissions_select_reveal on public.multiplayer_submissions;
create policy multiplayer_submissions_select_reveal
on public.multiplayer_submissions for select
using (
  user_id = auth.uid()
  or (
    public.is_couple_member(couple_id)
    and public.multiplayer_both_submissions_present(session_id)
  )
);

-- Zapisy są wykonywane wyłącznie przez funkcje SECURITY DEFINER powyżej.
grant select on public.multiplayer_sessions to authenticated;
grant select on public.multiplayer_submissions to authenticated;
grant execute on function public.create_spicy_match_session(text[]) to authenticated;
grant execute on function public.submit_spicy_match_session(uuid,smallint[]) to authenticated;
grant execute on function public.cancel_spicy_match_session(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'multiplayer_sessions'
  ) then
    alter publication supabase_realtime add table public.multiplayer_sessions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'multiplayer_submissions'
  ) then
    alter publication supabase_realtime add table public.multiplayer_submissions;
  end if;
end $$;
