-- Między Nami v0.7 — konta, pary i synchronizacja dwóch telefonów
-- Uruchom w Supabase SQL Editor na dedykowanym projekcie Między Nami.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Gracz',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role_index smallint not null check (role_index in (0,1)),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (couple_id, user_id),
  unique (user_id),
  unique (couple_id, role_index)
);

create table if not exists public.daily_submissions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  quiz_date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  question_ids text[] not null,
  answers smallint[] not null,
  completed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (couple_id, quiz_date, user_id),
  check (cardinality(question_ids) = 5),
  check (cardinality(answers) = 5),
  check (answers <@ array[0,1,2,3]::smallint[])
);

create table if not exists public.daily_results (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  quiz_date date not null,
  category text not null,
  question_ids text[] not null,
  score smallint not null check (score between 0 and 100),
  details jsonb not null default '[]'::jsonb,
  source text not null default 'cloud' check (source in ('cloud','local-import')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (couple_id, quiz_date),
  check (cardinality(question_ids) = 5)
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  client_session_id text not null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  rounds integer not null default 0 check (rounds >= 0),
  match_rate smallint not null default 0 check (match_rate between 0 and 100),
  shared_points integer not null default 0 check (shared_points >= 0),
  categories text[] not null default '{}',
  finished_at timestamptz not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (couple_id, client_session_id)
);

create index if not exists daily_submissions_couple_date_idx on public.daily_submissions(couple_id, quiz_date);
create index if not exists daily_results_couple_date_idx on public.daily_results(couple_id, quiz_date desc);
create index if not exists game_sessions_couple_finished_idx on public.game_sessions(couple_id, finished_at desc);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger couples_set_updated_at before update on public.couples
for each row execute function public.set_updated_at();
create trigger daily_submissions_set_updated_at before update on public.daily_submissions
for each row execute function public.set_updated_at();
create trigger daily_results_set_updated_at before update on public.daily_results
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(coalesce(new.email,'Gracz'),'@',1), 'Gracz')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_couple_member(target_couple uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.couple_members
    where couple_id = target_couple and user_id = target_user
  );
$$;

create or replace function public.both_daily_submissions_present(target_couple uuid, target_date date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select count(*) = 2
  from public.daily_submissions
  where couple_id = target_couple and quiz_date = target_date;
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 6));
    exit when not exists(select 1 from public.couples where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.create_couple(p_display_name text)
returns table(couple_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_couple public.couples;
  clean_name text := left(trim(coalesce(p_display_name,'')),40);
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if clean_name = '' then raise exception 'DISPLAY_NAME_REQUIRED'; end if;
  if exists(select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'ALREADY_IN_COUPLE';
  end if;

  insert into public.couples(invite_code, created_by)
  values (public.generate_invite_code(), auth.uid())
  returning * into new_couple;

  insert into public.couple_members(couple_id,user_id,display_name,role_index)
  values(new_couple.id,auth.uid(),clean_name,0);

  update public.profiles set display_name=clean_name where id=auth.uid();
  return query select new_couple.id, new_couple.invite_code;
end;
$$;

create or replace function public.join_couple(p_invite_code text, p_display_name text)
returns table(couple_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.couples;
  clean_code text := upper(trim(coalesce(p_invite_code,'')));
  clean_name text := left(trim(coalesce(p_display_name,'')),40);
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if clean_name = '' then raise exception 'DISPLAY_NAME_REQUIRED'; end if;
  if exists(select 1 from public.couple_members where user_id = auth.uid()) then
    raise exception 'ALREADY_IN_COUPLE';
  end if;

  select * into target from public.couples where couples.invite_code=clean_code for update;
  if target.id is null then raise exception 'INVALID_INVITE_CODE'; end if;
  if (select count(*) from public.couple_members where couple_members.couple_id=target.id) >= 2 then
    raise exception 'COUPLE_FULL';
  end if;

  insert into public.couple_members(couple_id,user_id,display_name,role_index)
  values(target.id,auth.uid(),clean_name,1);
  update public.profiles set display_name=clean_name where id=auth.uid();
  return query select target.id,target.invite_code;
end;
$$;

create or replace function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select couple_id into target from public.couple_members where user_id=auth.uid();
  if target is null then return; end if;
  -- Rozwiązanie pary usuwa wspólne dane w chmurze i obie relacje członkowskie.
  -- Lokalne dane na urządzeniach pozostają bez zmian.
  delete from public.couples where id=target;
end;
$$;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.daily_submissions enable row level security;
alter table public.daily_results enable row level security;
alter table public.game_sessions enable row level security;

-- Profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (id=auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());

-- Couple and members
drop policy if exists couples_select_member on public.couples;
create policy couples_select_member on public.couples for select using (public.is_couple_member(id));
drop policy if exists members_select_same_couple on public.couple_members;
create policy members_select_same_couple on public.couple_members for select using (public.is_couple_member(couple_id));

-- Daily submissions: własne odpowiedzi są widoczne od razu; odpowiedzi partnera dopiero po obu zgłoszeniach.
drop policy if exists submissions_select_reveal on public.daily_submissions;
create policy submissions_select_reveal on public.daily_submissions for select using (
  user_id=auth.uid() or (
    public.is_couple_member(couple_id) and public.both_daily_submissions_present(couple_id,quiz_date)
  )
);
drop policy if exists submissions_insert_own on public.daily_submissions;
create policy submissions_insert_own on public.daily_submissions for insert with check (
  user_id=auth.uid() and public.is_couple_member(couple_id)
);
drop policy if exists submissions_update_own on public.daily_submissions;
create policy submissions_update_own on public.daily_submissions for update using (
  user_id=auth.uid() and public.is_couple_member(couple_id)
) with check (
  user_id=auth.uid() and public.is_couple_member(couple_id)
);
drop policy if exists submissions_delete_own on public.daily_submissions;
create policy submissions_delete_own on public.daily_submissions for delete using (
  user_id=auth.uid() and public.is_couple_member(couple_id)
);

-- Results are available to both members after both submissions.
drop policy if exists results_select_member on public.daily_results;
create policy results_select_member on public.daily_results for select using (public.is_couple_member(couple_id));
drop policy if exists results_insert_member on public.daily_results;
create policy results_insert_member on public.daily_results for insert with check (
  created_by=auth.uid() and public.is_couple_member(couple_id) and public.both_daily_submissions_present(couple_id,quiz_date)
);
drop policy if exists results_update_member on public.daily_results;
create policy results_update_member on public.daily_results for update using (
  public.is_couple_member(couple_id)
) with check (
  public.is_couple_member(couple_id) and public.both_daily_submissions_present(couple_id,quiz_date)
);

-- Zwykłe sesje: oboje widzą wspólną historię, autor może dodawać własne podsumowania.
drop policy if exists sessions_select_member on public.game_sessions;
create policy sessions_select_member on public.game_sessions for select using (public.is_couple_member(couple_id));
drop policy if exists sessions_insert_author on public.game_sessions;
create policy sessions_insert_author on public.game_sessions for insert with check (
  uploaded_by=auth.uid() and public.is_couple_member(couple_id)
);
drop policy if exists sessions_update_author on public.game_sessions;
create policy sessions_update_author on public.game_sessions for update using (
  uploaded_by=auth.uid() and public.is_couple_member(couple_id)
) with check (
  uploaded_by=auth.uid() and public.is_couple_member(couple_id)
);
drop policy if exists sessions_delete_author on public.game_sessions;
create policy sessions_delete_author on public.game_sessions for delete using (
  uploaded_by=auth.uid() and public.is_couple_member(couple_id)
);

grant usage on schema public to authenticated;
grant select,update on public.profiles to authenticated;
grant select on public.couples to authenticated;
grant select on public.couple_members to authenticated;
grant select,insert,update,delete on public.daily_submissions to authenticated;
grant select,insert,update on public.daily_results to authenticated;
grant select,insert,update,delete on public.game_sessions to authenticated;
grant execute on function public.create_couple(text) to authenticated;
grant execute on function public.join_couple(text,text) to authenticated;
grant execute on function public.leave_couple() to authenticated;

-- Realtime dla oczekiwania na odpowiedź partnera.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='daily_submissions'
  ) then
    alter publication supabase_realtime add table public.daily_submissions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='daily_results'
  ) then
    alter publication supabase_realtime add table public.daily_results;
  end if;
end $$;
