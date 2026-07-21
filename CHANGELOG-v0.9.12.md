# Między Nami v0.9.12 — Pikantne i kontrast gier online

## Problem

- wejście do Pikantnych mogło uruchomić pętlę zmian DOM i zablokować interfejs,
- jasne karty gier online dziedziczyły biały tekst z ciemnego motywu,
- nagłówek PWA mógł nachodzić na pasek systemowy iPhone'a.

## Rozwiązanie

- usunięto zapętlony `MutationObserver` z warstwy Pikantnych,
- aktualizacje plakietek wykonują się tylko przy faktycznej zmianie,
- dodano osobny arkusz `v0912.css` z kontrastem dla wszystkich wspólnych komponentów online,
- poprawiono bezpieczny obszar iOS PWA.

## Baza danych

Brak zmian. Migracja SQL nie jest potrzebna.

## Bezpieczeństwo danych

Zmiana nie modyfikuje danych lokalnych, kont, par, odpowiedzi ani tabel Supabase.
