-- Między Nami v0.9.3
-- „Kto bardziej?” na dwóch telefonach w trybie na żywo.
-- Każde pytanie jest odsłaniane dopiero po odpowiedzi obojga.

-- Rozszerzamy istniejący silnik sesji o zwykłą grę who_live (10 pytań).
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
end
$$;

alter table public.multiplayer_sessions
  add constraint multiplayer_sessions_game_key_v093_check
  check (game_key in ('spicy_match', 'spicy_desire', 'who_live'));

alter table public.multiplayer_sessions
  add constraint multiplayer_sessions_question_count_v093_check
  check (
    (game_key = 'spicy_match' and cardinality(question_ids) = 8)
    or
    (game_key = 'spicy_desire' and cardinality(question_ids) = 5)
    or
    (game_key = 'who_live' and cardinality(question_ids) = 10)
  );

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
    else null
  end;
$$;

create table if not exists public.multiplayer_live_answers (
  session_id uuid not null
    references public.multiplayer_sessions(id) on delete cascade,
  couple_id uuid not null
    references public.couples(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  question_index smallint not null
    check (question_index between 0 and 19),
  answer smallint not null
    check (answer between 0 and 3),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, user_id, question_index)
);

create index if not exists multiplayer_live_answers_session_question_idx
  on public.multiplayer_live_answers(session_id, question_index, user_id);

alter table public.multiplayer_live_answers enable row level security;
alter table public.multiplayer_live_answers replica identity full;

create or replace function public.multiplayer_live_both_answers_present(
  p_session_id uuid,
  p_question_index integer
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct a.user_id) = 2
  from public.multiplayer_live_answers a
  where a.session_id = p_session_id
    and a.question_index = p_question_index;
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

  if p_game_key <> 'who_live' then
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

  -- Jedna aktywna lub zachowana runda tego trybu na parę.
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

create or replace function public.get_live_game_state(
  p_session_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target public.multiplayer_sessions;
  own_id uuid := auth.uid();
  partner_id uuid;
  answer_rows jsonb;
begin
  if own_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into target
  from public.multiplayer_sessions s
  where s.id = p_session_id;

  if target.id is null then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if not public.is_couple_member(target.couple_id, own_id) then
    raise exception 'NOT_A_COUPLE_MEMBER';
  end if;

  select cm.user_id
  into partner_id
  from public.couple_members cm
  where cm.couple_id = target.couple_id
    and cm.user_id <> own_id
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'question_index', q.idx,
        'own_done', own_answer.answer is not null,
        'partner_done', partner_answer.answer is not null,
        'own_answer', own_answer.answer,
        'partner_answer', case
          when own_answer.answer is not null
           and partner_answer.answer is not null
          then partner_answer.answer
          else null
        end,
        'revealed', own_answer.answer is not null
          and partner_answer.answer is not null
      )
      order by q.idx
    ),
    '[]'::jsonb
  )
  into answer_rows
  from generate_series(
    0,
    cardinality(target.question_ids) - 1
  ) as q(idx)
  left join public.multiplayer_live_answers own_answer
    on own_answer.session_id = target.id
   and own_answer.question_index = q.idx
   and own_answer.user_id = own_id
  left join public.multiplayer_live_answers partner_answer
    on partner_answer.session_id = target.id
   and partner_answer.question_index = q.idx
   and partner_answer.user_id = partner_id;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', target.id,
      'couple_id', target.couple_id,
      'game_key', target.game_key,
      'question_ids', target.question_ids,
      'status', target.status,
      'created_by', target.created_by,
      'created_at', target.created_at,
      'updated_at', target.updated_at,
      'completed_at', target.completed_at,
      'expires_at', target.expires_at
    ),
    'answers', answer_rows
  );
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

  if target.game_key <> 'who_live' then
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

  if p_answer < 0 or p_answer > 2 then
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

create or replace function public.cancel_live_game_session(
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
  from public.multiplayer_sessions s
  where s.id = p_session_id
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

drop policy if exists multiplayer_live_answers_select_revealed
on public.multiplayer_live_answers;

create policy multiplayer_live_answers_select_revealed
on public.multiplayer_live_answers
for select
using (
  user_id = auth.uid()
  or (
    public.is_couple_member(couple_id)
    and public.multiplayer_live_both_answers_present(
      session_id,
      question_index
    )
  )
);

revoke all on public.multiplayer_live_answers from anon;
grant select on public.multiplayer_live_answers to authenticated;

revoke all on function public.create_live_game_session(text, text[]) from public;
revoke all on function public.get_live_game_state(uuid) from public;
revoke all on function public.submit_live_game_answer(uuid, integer, smallint) from public;
revoke all on function public.cancel_live_game_session(uuid) from public;

grant execute on function public.create_live_game_session(text, text[]) to authenticated;
grant execute on function public.get_live_game_state(uuid) to authenticated;
grant execute on function public.submit_live_game_answer(uuid, integer, smallint) to authenticated;
grant execute on function public.cancel_live_game_session(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'multiplayer_live_answers'
  ) then
    alter publication supabase_realtime
      add table public.multiplayer_live_answers;
  end if;
end
$$;
