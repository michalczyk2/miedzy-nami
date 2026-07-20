-- Między Nami v0.9.8
-- „Skala” na dwóch telefonach oraz rozszerzenie wspólnego silnika odpowiedzi do zakresu 1–10.

-- Rozszerzamy dozwolone tryby sesji o scale_live (10 pytań).
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
      execute format(
        'alter table public.multiplayer_sessions drop constraint %I',
        item.conname
      );
    end if;
  end loop;
end
$$;

alter table public.multiplayer_sessions
  add constraint multiplayer_sessions_game_key_v098_check
  check (
    game_key in (
      'spicy_match',
      'spicy_desire',
      'who_live',
      'know_live',
      'dilemma_live',
      'scale_live'
    )
  );

alter table public.multiplayer_sessions
  add constraint multiplayer_sessions_question_count_v098_check
  check (
    (game_key = 'spicy_match' and cardinality(question_ids) = 8)
    or
    (game_key = 'spicy_desire' and cardinality(question_ids) = 5)
    or
    (game_key = 'who_live' and cardinality(question_ids) = 10)
    or
    (game_key = 'know_live' and cardinality(question_ids) = 10)
    or
    (game_key = 'dilemma_live' and cardinality(question_ids) = 10)
    or
    (game_key = 'scale_live' and cardinality(question_ids) = 10)
  );

-- Dotychczasowe gry używają odpowiedzi 0–3. Skala potrzebuje 0–9.
do $$
declare
  item record;
begin
  for item in
    select conname, lower(pg_get_constraintdef(oid)) as definition
    from pg_constraint
    where conrelid = 'public.multiplayer_live_answers'::regclass
      and contype = 'c'
  loop
    if item.definition like '%answer%between%'
       or item.definition like '%answer >=%'
       or item.definition like '%answer <=%' then
      execute format(
        'alter table public.multiplayer_live_answers drop constraint %I',
        item.conname
      );
    end if;
  end loop;
end
$$;

alter table public.multiplayer_live_answers
  add constraint multiplayer_live_answers_answer_v098_check
  check (answer between 0 and 9);

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
    when 'who_live' then 10
    when 'know_live' then 10
    when 'dilemma_live' then 10
    when 'scale_live' then 10
    else null
  end;
$$;

create or replace function public.create_live_game_session(
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

  if p_game_key not in (
    'who_live',
    'know_live',
    'dilemma_live',
    'scale_live'
  ) then
    raise exception 'INVALID_GAME_KEY';
  end if;

  expected_count := public.multiplayer_expected_question_count(p_game_key);

  if expected_count is null
     or cardinality(p_question_ids) <> expected_count then
    raise exception 'INVALID_QUESTION_COUNT';
  end if;

  if exists (
    select 1
    from unnest(p_question_ids) as q(item)
    where q.item is null or btrim(q.item) = ''
  ) then
    raise exception 'INVALID_QUESTION_IDS';
  end if;

  if (
    select count(distinct q.item)
    from unnest(p_question_ids) as q(item)
  ) <> expected_count then
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

  delete from public.multiplayer_sessions s
  where s.couple_id = target_couple
    and s.game_key = p_game_key;

  insert into public.multiplayer_sessions(
    couple_id,
    game_key,
    question_ids,
    created_by,
    expires_at
  )
  values(
    target_couple,
    p_game_key,
    p_question_ids,
    auth.uid(),
    timezone('utc', now()) + interval '48 hours'
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

create or replace function public.submit_live_game_answer(
  p_session_id uuid,
  p_question_index integer,
  p_answer smallint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.multiplayer_sessions;
  expected_count integer;
  max_answer integer;
  previous_incomplete boolean;
  total_answers integer;
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

  if target.game_key not in (
    'who_live',
    'know_live',
    'dilemma_live',
    'scale_live'
  ) then
    raise exception 'INVALID_GAME_KEY';
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

  expected_count := cardinality(target.question_ids);

  if p_question_index < 0 or p_question_index >= expected_count then
    raise exception 'INVALID_QUESTION_INDEX';
  end if;

  max_answer := case
    when target.game_key = 'know_live' then 3
    when target.game_key = 'who_live' then 2
    when target.game_key = 'dilemma_live' then 1
    when target.game_key = 'scale_live' then 9
    else -1
  end;

  if p_answer < 0 or p_answer > max_answer then
    raise exception 'INVALID_ANSWER';
  end if;

  if public.multiplayer_live_both_answers_present(
    target.id,
    p_question_index
  ) then
    raise exception 'QUESTION_LOCKED';
  end if;

  if p_question_index > 0 then
    select exists (
      select 1
      from generate_series(0, p_question_index - 1) as previous(idx)
      where not public.multiplayer_live_both_answers_present(
        target.id,
        previous.idx
      )
    )
    into previous_incomplete;

    if previous_incomplete then
      raise exception 'QUESTION_NOT_READY';
    end if;
  end if;

  insert into public.multiplayer_live_answers(
    session_id,
    couple_id,
    user_id,
    question_index,
    answer
  )
  values(
    target.id,
    target.couple_id,
    auth.uid(),
    p_question_index,
    p_answer
  )
  on conflict (session_id, user_id, question_index)
  do update set
    answer = excluded.answer,
    updated_at = timezone('utc', now());

  update public.multiplayer_sessions
  set updated_at = timezone('utc', now())
  where id = target.id;

  select count(*)
  into total_answers
  from public.multiplayer_live_answers a
  where a.session_id = target.id;

  if total_answers = expected_count * 2 then
    update public.multiplayer_sessions
    set
      status = 'completed',
      completed_at = coalesce(completed_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
    where id = target.id;
  end if;

  return public.get_live_game_state(target.id);
end;
$$;

revoke all on function public.create_live_game_session(text, text[]) from public;
revoke all on function public.submit_live_game_answer(uuid, integer, smallint) from public;

grant execute on function public.create_live_game_session(text, text[]) to authenticated;
grant execute on function public.submit_live_game_answer(uuid, integer, smallint) to authenticated;
