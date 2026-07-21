# Między Nami v0.9.13 — bezpieczny hub Pikantnych i ciemne gry online

## Problem

Wersja v0.9.12 poprawiła czytelność tekstu, ale pozostawiła jasne karty. Nie odpowiadało to spójnemu, ciemnemu wyglądowi aplikacji.

Na części urządzeń wejście w Pikantne nadal mogło zablokować interfejs. Najbardziej prawdopodobną przyczyną było uruchamianie wcześniejszego pliku `v0911.js` z pamięci PWA. Plik zachował tę samą nazwę między wydaniami.

## Rozwiązanie

- dodano nowy plik runtime `v0913.js`, ładowany po wszystkich wcześniejszych modułach,
- każdy stary powrót do `v082-spicy-hub` jest natychmiast przekierowywany do nowego, bezpiecznego widoku `v0913-spicy-hub`,
- nowy hub nie uruchamia starego mechanizmu modyfikującego kafelki,
- zachowano zgodę 18+, pauzę, pomijanie, jeden telefon i dwa telefony,
- dodano nowy arkusz `v0913.css`,
- pytania, odpowiedzi, Skala i karty instrukcji w grach online mają ciemny wygląd zgodny z klasyczną grą,
- nowe pliki runtime i CSS są pobierane `network-first` z `cache: no-store`.

## Zmienione pliki

- `main.ts`
- `index.html`
- `sw.js`
- `package.json`
- `release.js`
- `version.json`
- `manifest.webmanifest`
- `v0913.js`
- `v0913.css`
- `stabilization-v0913.test.mjs`

## Baza danych

Brak zmian. Nie uruchamiaj żadnej migracji SQL.

## Dane użytkowników

Zmiana nie usuwa danych lokalnych, kont, połączenia pary, sesji ani rekordów Supabase.

## Commit

`fix: replace spicy hub and darken online games v0.9.13`

## Test po wdrożeniu

1. Otwórz Pikantne.
2. Wróć z każdej gry do huba Pikantnych.
3. Sprawdź Znasz mnie, Kto bardziej, Wybór i Skalę.
4. Sprawdź lokalną grę na jednym telefonie.
5. Sprawdź, czy odpowiedź partnera pozostaje ukryta.
6. Zamknij PWA, uruchom ponownie i powtórz wejście w Pikantne.

## Rollback

W GitHubie przywróć poprzedni commit v0.9.12. Baza danych nie wymaga cofania.
