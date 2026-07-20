-- Między Nami v0.8.3
-- Naprawa generatora sześci znakowego kodu pary bez zależności od pgcrypto.gen_random_bytes.

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  candidate text;
begin
  loop
    candidate := pg_catalog.upper(
      pg_catalog.substr(
        pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
        1,
        6
      )
    );

    exit when not exists (
      select 1
      from public.couples as c
      where c.invite_code = candidate
    );
  end loop;

  return candidate;
end;
$$;
