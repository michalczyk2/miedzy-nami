# Architektura Między Nami v0.9.2

## Warstwa budowania

- Vite tworzy produkcyjny katalog `dist`.
- TypeScript działa w trybie `strict`.
- `main.ts` jest jedynym punktem wejścia w `index.html`.
- `vite.config.ts` kopiuje istniejące zasoby runtime i dopisuje hashowane pliki buildu do Service Workera.
- Supabase JS jest przypięty w `package.json`, a nie pobierany z niezablokowanego CDN.

## Runtime kompatybilności

Migracja pozostaje etapowa. `main.ts` uruchamia w kontrolowanej kolejności:

- `app.js` — podstawowy silnik gier,
- `enhancements.js`, `v05.js`, `v06.js` — funkcje lokalne, pulpit i Codzienne Dopasowanie,
- `v07.js` — logowanie, para, synchronizacja i historia online,
- `v071.js`, `v08.js` — UX konta, onboarding i menu,
- `v081.js`, `v082.js` — pakiet Pikantne 18+,
- `v083.js` — aktualizacje PWA, offline i obsługa błędów.

Kolejne etapy będą przenosić te warstwy do modułów TypeScript bez zmiany kontraktów danych i bez jednorazowego przepisywania całej aplikacji.

## Backend

Dedykowany projekt Supabase:

- Supabase Auth — osobne konta obu osób,
- PostgreSQL — profile, para, odpowiedzi i wyniki,
- Row Level Security — dostęp wyłącznie dla członków pary,
- Realtime — automatyczne wykrycie odpowiedzi partnera.

Publiczny `publishable key` znajduje się w frontendzie. Klucze `secret` i `service_role` nie są używane w przeglądarce.

## Tryb bez konta

Gry lokalne pozostają dostępne bez logowania. Konto jest wymagane wyłącznie do synchronizacji między urządzeniami.


## Warstwa v0.9.1 — sesje na dwóch telefonach

- `v091.js` obsługuje pierwszą pełną grę Realtime poza Codziennym Dopasowaniem.
- `multiplayer_sessions` przechowuje wspólny zestaw pytań i stan rundy.
- `multiplayer_submissions` przechowuje prywatne odpowiedzi każdego konta.
- RLS ujawnia odpowiedzi partnera dopiero po dwóch ukończonych zgłoszeniach.
- nowa runda usuwa poprzedni wynik i odpowiedzi gry 18+, ograniczając retencję prywatnych danych.


## Silnik multiplayer v0.9.2

- `multiplayer-core-v092.js` zawiera wspólne operacje sesji, Realtime, draftów i błędów.
- `v091.js` zachowuje działające Dopasowanie 18+.
- `v092.js` jest pierwszą grą opartą o generyczny silnik wyborów: Ochota na dziś.
- `004_v092_multiplayer_choice_engine.sql` rozszerza model sesji z 8 na obsługę 8 lub 5 pytań i zachowuje stare RPC jako wrappery.
