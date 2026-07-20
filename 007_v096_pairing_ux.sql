-- Między Nami v0.9.6
-- Bezpieczna zmiana pustej, jednoosobowej pary na kod utworzony przez partnera.

create or replace function public.switch_waiting_couple(
  p_invite_code text,
  p_display_name text
)
returns table(couple_id uuid, invite_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_couple_id uuid;
  current_member_count integer;
  target public.couples;
  target_member_count integer;
  target_role smallint;
  clean_code text := pg_catalog.upper(pg_catalog.trim(pg_catalog.coalesce(p_invite_code, '')));
  clean_name text := pg_catalog.left(pg_catalog.trim(pg_catalog.coalesce(p_display_name, '')), 40);
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if clean_name = '' then
    raise exception 'DISPLAY_NAME_REQUIRED';
  end if;

  if clean_code !~ '^[A-Z0-9]{6}$' then
    raise exception 'INVALID_INVITE_CODE';
  end if;

  select cm.couple_id
  into current_couple_id
  from public.couple_members as cm
  where cm.user_id = auth.uid();

  if current_couple_id is null then
    raise exception 'CURRENT_COUPLE_REQUIRED';
  end if;

  select count(*)
  into current_member_count
  from public.couple_members as cm
  where cm.couple_id = current_couple_id;

  if current_member_count <> 1 then
    raise exception 'CURRENT_COUPLE_NOT_EMPTY';
  end if;

  select c.*
  into target
  from public.couples as c
  where c.invite_code = clean_code
  for update;

  if target.id is null then
    raise exception 'INVALID_INVITE_CODE';
  end if;

  if target.id = current_couple_id then
    raise exception 'SAME_COUPLE_CODE';
  end if;

  select count(*)
  into target_member_count
  from public.couple_members as cm
  where cm.couple_id = target.id;

  if target_member_count >= 2 then
    raise exception 'COUPLE_FULL';
  end if;

  target_role := case
    when exists (
      select 1
      from public.couple_members as cm
      where cm.couple_id = target.id
        and cm.role_index = 0
    ) then 1
    else 0
  end;

  -- Usuwa wyłącznie pustą parę, w której zalogowana osoba była jedynym członkiem.
  delete from public.couples
  where id = current_couple_id;

  insert into public.couple_members(couple_id, user_id, display_name, role_index)
  values(target.id, auth.uid(), clean_name, target_role);

  update public.profiles
  set display_name = clean_name,
      updated_at = timezone('utc', now())
  where id = auth.uid();

  return query
  select target.id, target.invite_code;
end;
$$;

grant execute
on function public.switch_waiting_couple(text, text)
to authenticated;
