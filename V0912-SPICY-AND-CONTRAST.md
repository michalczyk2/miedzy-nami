# v0.9.12 — Pikantne i kontrast gier online

## Problem

1. Wejście do sekcji Pikantne mogło zawiesić interfejs. Moduł v0.9.11 uruchamiał `MutationObserver`, a funkcja porządkująca kafelki modyfikowała obserwowane elementy przy każdym wywołaniu. Powstawała pętla zmian DOM.
2. Gry online używały jasnych kart i przycisków, ale część tekstu dziedziczyła biały kolor głównego motywu.
3. Na iOS PWA nagłówek mógł nachodzić na pasek systemowy.

## Rozwiązanie

- usunięto obserwator Pikantnych i pozostawiono porządkowanie kafelków po kontrolowanym `render()`,
- aktualizacje treści i klas kafelków są idempotentne,
- dodano osobny arkusz `v0912.css` z kontrastem dla wspólnych komponentów gier online,
- dodano korektę górnego safe area na telefonach,
- dodano test regresji `stabilization-v0912.test.mjs`.

## Baza danych

Brak zmian. Migracja SQL nie jest potrzebna.

## Dane użytkowników

Zmiana nie usuwa ani nie modyfikuje lokalnych sesji, kont, par, odpowiedzi ani rekordów Supabase.

## Rollback

Uruchom `node rollback-v0.9.12.mjs` w katalogu repozytorium albo przywróć pliki z katalogu backupu utworzonego przez instalator.
