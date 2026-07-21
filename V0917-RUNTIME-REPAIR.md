# Między Nami v0.9.17 — naprawa runtime i cache

## Potwierdzona główna przyczyna

Problem nie wynikał wyłącznie z pamięci Safari.

Konfiguracja produkcyjnego buildu kopiowała pliki aplikacji tylko do `v0911.js`.
Nowsze moduły `v0913.js`, `v0915.js`, `v0916.js` oraz odpowiadające im style znajdowały się w repozytorium, ale nie trafiały konsekwentnie do katalogu `dist`.

Service Worker przechowywał część tych plików ze starszych wdrożeń. W zależności od tego, czy Safari użyło sieci, starego cache albo aktywnego Service Workera, aplikacja mogła pokazać `v0.9.10`, `v0.9.12` albo `v0.9.16`.

To samo powodowało, że nowa Skala 1–5 czasem nie była ładowana, a kliknięcie starej niedokończonej sesji zawsze otwierało dawną mechanikę 1–10.

## Rozwiązanie systemowe

1. Vite automatycznie wykrywa i kopiuje wszystkie pliki `v*.js`, `v*.css`, `multiplayer-*.js` i `spicy-*.js`.
2. Build kończy się błędem, jeśli `main.ts` albo `index.html` wskazuje plik, którego nie ma w `dist`.
3. Każdy starszy moduł jest ładowany z parametrem wersji, np. `v0917.js?v=0.9.17`.
4. Service Worker:
   - pobiera zmienne pliki najpierw z sieci,
   - używa cache tylko przy braku internetu,
   - usuwa wszystkie poprzednie cache Między Nami,
   - aktywuje się od razu,
   - przeładowuje aplikację maksymalnie raz po zmianie kontrolera.
5. Wersja UI zawsze pochodzi z `MN_RELEASE`.
6. Stara Skala 1–10 jest wyraźnie oddzielona od nowej Skali 1–5.
7. Usunięcie starej sesji wymaga jawnego potwierdzenia użytkownika.

## Dane

Brak migracji SQL.

Aktualizacja nie usuwa automatycznie:
- kont,
- pary,
- odpowiedzi chmurowych,
- statystyk,
- ulubionych,
- własnych kart,
- niedokończonych sesji.

## Zmienione pliki

- `main.ts`
- `vite.config.ts`
- `sw.js`
- `index.html`
- `package.json`
- `package-lock.json`
- `release.js`
- `version.json`
- `manifest.webmanifest`
- `v0917.js`
- `v0917.css`
- `stabilization-v0917.test.mjs`
- `V0917-RUNTIME-REPAIR.md`

## Commit

`fix: rebuild runtime asset pipeline and stabilize Scale v0.9.17`

## Rollback

Przywróć commit v0.9.16. Baza nie wymaga cofania.
