-- Między Nami v0.9.2
-- Wspólny silnik gier wyboru na dwóch telefonach.
-- Dodaje „Ochota na dziś” (5 pytań) bez naruszania działającego Dopasowania 18+ (8 pytań).

-- Stare ograniczenia v0.9.1 dopuszczały wyłącznie spicy_match i dokładnie 8 odpowiedzi.
-- Usuwamy tylko te konkretne CHECK-i, niezależnie od nazw nadanych przez PostgreSQL.
do $$
declare
  item record;
begin
  for item in
    select conname, lower(pg_get_constraintdef(oid)) as definition
    from pg_constraint
    where conrelid = 'public.multiplayer_sessions'::regclass
      and contype = 'c'
  loop
    if item.definition like '%game_key%'
       or item.definition like '%cardinality(question_ids)%' then
      execute format('alter table public.multiplayer_sessions drop constraint %I', item.conname);
    end if;
  end loop;

  for item in
    select conname, lower(pg_get_constraintdef(oid)) as definition
    from pg_constraint
    where conrelid = 'public.multiplayer_submissions'::regclass
      and contype = 'c'
  loop
    if item.definition like '%cardinality(answers)%' then
      execute format('alter table public.multiplayer_submissions drop constraint %I', item.conname);
    end if;
  end loop;
end
$$;

alter table public.multiplayer_sessions
  add constraint multiplayer_sessions_game_key_v092_check
  check (game_key in ('spicy_match', 'spicy_desire'));

alter table public.multiplayer_sessions
  add constraint multiplayer_sessions_question_count_v092_check
  check (
    (game_key = 'spicy_match' and cardinality(question_ids) = 8)
    or
    (game_key = 'spicy_desire' and cardinality(question_ids) = 5)
  );

alter table public.multiplayer_submissions
  add constraint multiplayer_submissions_answer_count_v092_check
  check (cardinality(answers) between 1 and 20);

create or replace function public.multiplayer_expected_question_count(
  p_game_key text
)
returns integer
language sql
immutable
security invoker
set search_path = ''
as $$
  select case p_game_key
    when 'spicy_match' then 8
    when 'spicy_desire' then 5
    else null
  end;
$$;

create or replace function public.create_multiplayer_choice_session(
  p_game_key text,
  p_question_ids text[]
)
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
  expected_count integer;
  created public.multiplayer_sessions;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  expected_count := public.multiplayer_expected_question_count(p_game_key);
  if expected_count is null then
    raise exception 'INVALID_GAME_KEY';
  end if;

  if cardinality(p_question_ids) <> expected_count then
    raise exception 'INVALID_QUESTION_COUNT';
  end if;

  if exists (
    select 1
    from unnest(p_question_ids) as q(item)
    where q.item is null or btrim(q.item) = ''
  ) then
    raise exception 'INVALID_QUESTION_IDS';
  end if;

  if (select count(distinct q.item) from unnest(p_question_ids) as q(item)) <> expected_count then
    raise exception 'DUPLICATE_QUESTION_IDS';
  end if;

  select cm.couple_id
  into target_couple
  from public.couple_members cm
  where cm.user_id = auth.uid();

  if target_couple is null then
    raise exception 'COUPLE_REQUIRED';
  end if;

  select count(*)
  into member_count
  from public.couple_members cm
  where cm.couple_id = target_couple;

  if member_count <> 2 then
    raise exception 'PARTNER_REQUIRED';
  end if;

  -- Każda gra ma najwyżej jedną zachowaną rundę.
  -- Nowa runda kasuje wcześniejsze intymne odpowiedzi tylko tego trybu.
  delete from public.multiplayer_sessions s
  where s.couple_id = target_couple
    and s.game_key = p_game_key;

  insert into public.multiplayer_sessions(
    couple_id,
    game_key,
    question_ids,
    created_by
  )
  values(
    target_couple,
    p_game_key,
    p_question_ids,
    auth.uid()
  )
  returning * into created;

  return query
  select
    created.id,
    created.couple_id,
    created.game_key,
    created.question_ids,
    created.status,
    created.created_by,
    created.created_at,
    created.expires_at;
end;
$$;

create or replace function public.submit_multiplayer_choice_session(
  p_session_id uuid,
  p_answers smallint[]
)
returns table(
  session_id uuid,
  status text,
  completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.multiplayer_sessions;
  expected_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into target
  from public.multiplayer_sessions s
  where s.id = p_session_id
  for update;

  if target.id is null then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  expected_count := public.multiplayer_expected_question_count(target.game_key);
  if expected_count is null then
    raise exception 'INVALID_GAME_KEY';
  end if;

  if cardinality(p_answers) <> expected_count then
    raise exception 'INVALID_ANSWER_COUNT';
  end if;

  if not (p_answers <@ array[0, 1, 2, 3]::smallint[]) then
    raise exception 'INVALID_ANSWERS';
  end if;

  if target.status <> 'active' then
    raise exception 'SESSION_NOT_ACTIVE';
  end if;

  if target.expires_at <= timezone('utc', now()) then
    raise exception 'SESSION_EXPIRED';
  end if;

  if not public.is_couple_member(target.couple_id, auth.uid()) then
    raise exception 'NOT_A_COUPLE_MEMBER';
  end if;

  insert into public.multiplayer_submissions(
    session_id,
    couple_id,
    user_id,
    answers
  )
  values(
    target.id,
    target.couple_id,
    auth.uid(),
    p_answers
  )
  on conflict (session_id, user_id)
  do update set
    answers = excluded.answers,
    completed_at = timezone('utc', now()),
    updated_at = timezone('utc', now());

  return query
  select s.id, s.status, s.completed_at
  from public.multiplayer_sessions s
  where s.id = target.id;
end;
$$;

create or replace function public.cancel_multiplayer_choice_session(
  p_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.multiplayer_sessions;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into target
  from public.multiplayer_sessions
  where id = p_session_id
  for update;

  if target.id is null then
    return;
  end if;

  if not public.is_couple_member(target.couple_id, auth.uid()) then
    raise exception 'NOT_A_COUPLE_MEMBER';
  end if;

  delete from public.multiplayer_sessions
  where id = target.id;
end;
$$;

-- Zachowujemy stare RPC v0.9.1 jako zgodne wstecznie wrappery.
create or replace function public.create_spicy_match_session(
  p_question_ids text[]
)
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
language sql
security definer
set search_path = ''
as $$
  select *
  from public.create_multiplayer_choice_session('spicy_match', p_question_ids);
$$;

create or replace function public.submit_spicy_match_session(
  p_session_id uuid,
  p_answers smallint[]
)
returns table(
  session_id uuid,
  status text,
  completed_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select *
  from public.submit_multiplayer_choice_session(p_session_id, p_answers);
$$;

create or replace function public.cancel_spicy_match_session(
  p_session_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  select public.cancel_multiplayer_choice_session(p_session_id);
$$;

revoke all on function public.create_multiplayer_choice_session(text, text[]) from public;
revoke all on function public.submit_multiplayer_choice_session(uuid, smallint[]) from public;
revoke all on function public.cancel_multiplayer_choice_session(uuid) from public;

grant execute on function public.create_multiplayer_choice_session(text, text[]) to authenticated;
grant execute on function public.submit_multiplayer_choice_session(uuid, smallint[]) to authenticated;
grant execute on function public.cancel_multiplayer_choice_session(uuid) to authenticated;

revoke all on function public.create_spicy_match_session(text[]) from public;
revoke all on function public.submit_spicy_match_session(uuid, smallint[]) from public;
revoke all on function public.cancel_spicy_match_session(uuid) from public;

grant execute on function public.create_spicy_match_session(text[]) to authenticated;
grant execute on function public.submit_spicy_match_session(uuid, smallint[]) to authenticated;
grant execute on function public.cancel_spicy_match_session(uuid) to authenticated;
