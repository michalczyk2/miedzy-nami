# Między Nami v0.9.3 — „Kto bardziej?” na dwóch telefonach

## Cel wydania

v0.9.3 przenosi pierwszy zwykły tryb gry do synchronizacji na żywo. W przeciwieństwie do wcześniejszych gier multiplayer, które ujawniały wynik dopiero po całym zestawie pytań, „Kto bardziej?” odsłania wynik po każdej karcie.

## Przebieg rozgrywki

1. Jedna osoba rozpoczyna 10-kartową sesję.
2. Oboje widzą tę samą kartę na osobnych telefonach.
3. Każde wybiera jedną z trzech odpowiedzi: osoba 1, osoba 2 albo oboje.
4. Do czasu odpowiedzi drugiej osoby widoczny jest wyłącznie status „odpowiedź oddana”.
5. Po odpowiedzi obojga aplikacja ujawnia obie odpowiedzi i bieżący wynik.
6. Dopiero wtedy odblokowuje się następna karta.
7. Po 10 kartach oba telefony pokazują wspólne podsumowanie.

## Bezpieczeństwo stanu

- serwer blokuje odpowiadanie na przyszłe pytania,
- ujawnionej odpowiedzi nie można zmienić,
- odpowiedź partnera jest maskowana do chwili odpowiedzi obojga,
- sesja wygasa po 48 godzinach,
- nowa sesja zastępuje poprzedni wynik tej gry,
- szczegółowe odpowiedzi nie trafiają do ogólnej historii aplikacji.

## Warstwa danych

Migracja `005_v093_live_who_more.sql` dodaje:

- grę `who_live` do `multiplayer_sessions`,
- tabelę `multiplayer_live_answers`,
- RPC `create_live_game_session`,
- RPC `get_live_game_state`,
- RPC `submit_live_game_answer`,
- RPC `cancel_live_game_session`,
- polityki RLS odsłaniające odpowiedź partnera dopiero po dwóch odpowiedziach,
- publikację Realtime dla odpowiedzi na żywo.

## Warstwa klienta

- `multiplayer-live-core-v093.js` — wspólny transport RPC, Realtime, błędy i wznowienie sesji,
- `v093.js` — lobby, rozgrywka karta po karcie, aktywna gra na ekranie głównym i podsumowanie,
- `multiplayer-v093.test.mjs` — testy kontraktu SQL i klienta.

Ten fundament może później obsłużyć także `Co wybierasz?`, `Idealny plan, fatalny szczegół` i inne gry wyboru bez projektowania osobnego protokołu synchronizacji.
