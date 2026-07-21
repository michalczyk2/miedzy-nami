# Między Nami v0.9.14 — porządek kart na pulpicie

## Problem

Na iPhonie karta „5 pytań dla was obojga” stykała się z kartą „Kontynuujcie wspólne gry”.
Rozmyta dekoracja prawej strony karty dziennej mogła też wyjść poza jej zaokrąglony obrys.

## Rozwiązanie

- dodano stały odstęp 20 px pod kartą Codziennego Dopasowania,
- dodano jednoznaczne przycinanie dekoracji do promienia 28 px,
- zastosowano zabezpieczenie zgodne z Safari/iOS,
- nie zmieniono kolejności elementów, routingu ani logiki Centrum online.

## Zmienione pliki

- `index.html`
- `sw.js`
- `package.json`
- `release.js`
- `version.json`
- `manifest.webmanifest`
- `v0914.css`
- `stabilization-v0914.test.mjs`

## Baza danych

Brak zmian. Nie uruchamiaj SQL-a.

## Dane i regresje

Zmiana nie dotyka:
- danych lokalnych,
- kont i par,
- sesji online,
- pytań,
- odpowiedzi,
- Service Workera poza dodaniem nowego arkusza do cache.

## Commit

`fix: separate dashboard cards and clip daily decoration v0.9.14`

## Test po wdrożeniu

1. Sprawdź odstęp między kartą dzienną a Centrum online.
2. Sprawdź prawą krawędź karty dziennej.
3. Otwórz obie karty i wróć na pulpit.
4. Zamknij PWA, uruchom ponownie i sprawdź pulpit.
5. Sprawdź, czy Pikantne i gry online nadal się otwierają.

## Rollback

Przywróć commit v0.9.13. Baza danych nie wymaga cofania.
