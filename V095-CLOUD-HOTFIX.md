# Między Nami v0.9.5 — hotfix połączenia chmurowego

## Problem

Ekran „Synchronizuję dane…” mógł pozostać aktywny bez końca, jeżeli zapytanie Supabase na iPhonie nie zwróciło odpowiedzi albo inicjalizacja auth uruchomiła się równolegle.

## Naprawa

- jedno współdzielone ładowanie stanu konta,
- callback `onAuthStateChange` nie wykonuje bezpośrednio asynchronicznych zapytań,
- timeout zapytań: 12 sekund,
- watchdog loadera: 15 sekund,
- przycisk ponowienia,
- historia lokalna synchronizowana w tle.

Migracja SQL nie jest wymagana.
