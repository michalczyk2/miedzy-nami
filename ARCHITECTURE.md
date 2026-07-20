# Architektura Między Nami v0.9.9

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

## Silnik live multiplayer v0.9.3

`multiplayer-live-core-v093.js` obsługuje sesje, które synchronizują każdą kartę osobno. Warstwa danych używa `multiplayer_live_answers`, a klient pobiera zamaskowany stan przez `get_live_game_state`. Partnerowski wybór jest zwracany dopiero wtedy, gdy istnieją dwie odpowiedzi dla tego samego indeksu pytania. Aktualizacja `multiplayer_sessions.updated_at` daje obu urządzeniom wspólny sygnał Realtime również wtedy, gdy RLS nadal ukrywa sam wiersz odpowiedzi.

`v093.js` jest pierwszym konsumentem tego protokołu. Utrzymuje lokalny indeks oglądanej karty, lecz kolejność i blokady są egzekwowane przez PostgreSQL. Dzięki temu odświeżenie strony, utrata sieci albo równoczesne kliknięcia nie pozwalają pominąć pytania ani zmienić odsłoniętego wyniku.


## Gra prawda kontra przewidywanie v0.9.4

`v094.js` używa tego samego protokołu live co `v093.js`, lecz interpretuje dwa wybory asymetrycznie. Osoba odpowiadająca jest wyznaczana na podstawie kolejności członków pary i parzystości indeksu pytania. Dzięki temu oba telefony niezależnie wyliczają identyczną rolę bez dodatkowego stanu w bazie.

Migracja `006_v094_live_know_me.sql` rozszerza dozwolone typy sesji o `know_live` i dopuszcza cztery opcje odpowiedzi. Blokady kolejności, maskowanie odpowiedzi, wygasanie sesji oraz RLS pozostają wspólne dla obu zwykłych gier live.

## v0.9.8 — Scale live + device capability labels

`v098.js` dodaje tryb `scale_live`, korzystający z istniejących tabel sesji i odpowiedzi. Migracja 009 rozszerza dozwolony zakres odpowiedzi do 0–9. Ten sam moduł nakłada nieinwazyjne oznaczenia możliwości urządzeń na pulpit i hub Pikantne.


## v0.9.9 — agregator sesji online

`v099.js` jest warstwą prezentacyjną ponad istniejącymi modułami multiplayer. Nie zmienia protokołów gier ani schematu bazy. Pobiera aktywne i ostatnie ukończone rekordy z `multiplayer_sessions`, mapuje je na publiczne funkcje modułów v0.9.1–v0.9.8 i pokazuje w jednym widoku.

Moduł usuwa starsze, niezależne banery z pulpitu i zastępuje je pojedynczą kartą centrum. Ponieważ poszczególne moduły mogą odświeżać się asynchronicznie, `MutationObserver` pilnuje, aby stare banery nie pojawiały się ponownie.

Stan Codziennego Dopasowania jest dołączany z `MN_CLOUD_RUNTIME`, bez kopiowania odpowiedzi. Centrum nie przechowuje nowych danych i nie wymaga migracji SQL.
