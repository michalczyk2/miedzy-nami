# v0.9.11 — stabilizacja runtime i wspólne statystyki

## Naprawiony routing gier

Starszy rdzeń aplikacji przechowuje `ui`, `app`, `profile`, `settings` i `currentSession` jako globalne wiązania leksykalne. Moduły multiplayer odwoływały się jednak do tych wartości przez `globalThis`. W przeglądarce nie są to automatycznie te same właściwości, dlatego kliknięcie gry mogło zakończyć się komunikatem „Nie udało się otworzyć gry”.

Moduł `v0911.js` dodaje kontrolowany most kompatybilności oraz bezpieczny router z lokalnym fallbackiem.

## Wspólne statystyki pary

Ukończona sesja lokalna jest nadal zapisywana na urządzeniu, a po zalogowaniu do pełnej pary zostaje wysłana do istniejącej tabeli `game_sessions`. Oba konta mogą odczytać sesje swojej pary dzięki istniejącym politykom RLS.

Ekran statystyk łączy:

- zwykłe sesje z `game_sessions`,
- Codzienne Dopasowanie z `daily_results`,
- ewentualne lokalne sesje, których przesłanie jeszcze się nie zakończyło.

Rekordy są deduplikowane przez `client_session_id`. Aktualizacja nie wymaga nowej migracji SQL.

## Pikantne

Stare nakładane plakietki urządzeń są usuwane. Informacja „1–2 telefony” albo „1 telefon” znajduje się teraz w treści karty jako mała etykieta, dzięki czemu nie zasłania nazwy ani opisu gry.
