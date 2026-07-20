# Między Nami v0.9.1 — Dopasowanie 18+ na dwóch telefonach

## Zakres

Pierwszą grą poza Codziennym Dopasowaniem działającą równolegle na dwóch urządzeniach jest `Dopasowanie 18+`.

1. Jedna osoba rozpoczyna rundę.
2. Supabase zapisuje jeden wspólny zestaw 8 identyfikatorów pytań.
3. Każde konto zapisuje własną tablicę odpowiedzi.
4. RLS pozwala odczytać odpowiedzi partnera dopiero po obu zgłoszeniach.
5. Trigger zmienia stan sesji na `completed`.
6. Realtime odświeża oba telefony i pokazuje wspólny wynik.

## Migracja

W Supabase SQL Editor uruchom:

```text
supabase/migrations/003_v091_spicy_match_two_phones.sql
```

Migracja tworzy:

- `multiplayer_sessions`,
- `multiplayer_submissions`,
- RPC `create_spicy_match_session`,
- RPC `submit_spicy_match_session`,
- RPC `cancel_spicy_match_session`,
- polityki RLS i publikację Realtime.

## Prywatność

Konkretne odpowiedzi nie trafiają do `game_sessions`. Rozpoczęcie nowej rundy usuwa poprzednią sesję tej gry wraz z odpowiedziami. Wynik można również usunąć ręcznie z ekranu podsumowania.
