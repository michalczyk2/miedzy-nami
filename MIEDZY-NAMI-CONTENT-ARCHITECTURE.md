# Między Nami — plan architektury treści

**Punkt odniesienia:** v0.9.14  
**Status:** PLANOWANE  
**Cel:** przygotować aplikację na kilka tysięcy kart bez pełnego przepisywania projektu.

## Decyzja

Nie przenosimy całej biblioteki naraz. Każdą grę migrujemy osobno, przy okazji jej przebudowy.

## Warstwy

1. `legacy` — obecne karty i obecne identyfikatory.
2. `typed content` — nowe moduły TypeScript dla przebudowywanych gier.
3. `compatibility adapter` — wspólny format widziany przez istniejący silnik.
4. `validators` — kontrola jakości przy buildzie.
5. `reports` — liczby kart, kategorie, poziomy i duplikaty.

## Proponowana struktura

```text
src/
  content/
    schemas.ts
    registry.ts
    validators.ts
    reports.ts
    games/
      scale/
        schema.ts
        cards-001.ts
      know/
      who/
      choice/
      plan/
      story/
      talk/
      adult/
```

W aktualnej aplikacji Vite można rozpocząć od `content-v1/`, jeżeli pełne `src/` byłoby zbyt dużą zmianą. Najważniejsze jest odseparowanie danych od renderowania.

## Zasady migracji

- jedna gra na jeden etap,
- brak zmiany starych ID,
- każdy nowy moduł ma adapter do aktualnego `LIBRARY`,
- test porównuje liczbę kart przed i po migracji,
- rollback polega na usunięciu nowego modułu i przywróceniu poprzedniego wpisu ładowania,
- żadna migracja bazy nie jest potrzebna do samego podziału plików.

## Minimalne testy

1. Unikalne ID w całej bibliotece.
2. Wszystkie tryby wskazują istniejącą grę.
3. Zwykłe treści nie zawierają kategorii 18+.
4. Treści 18+ nie trafiają do `eligibleCards()` zwykłych gier.
5. Każdy wariant odpowiedzi ma poprawną liczbę opcji.
6. Stare ulubione nadal odnajdują kartę po ID.
7. Losowanie nie zwraca tej samej karty dwa razy w jednej sesji.
8. Raport liczby kart jest zgodny z produkcyjną wartością.
9. Build nie ładuje modułu 18+ przed otwarciem Pikantnych, gdy wdrożymy lazy loading.
10. Maksymalna długość tekstu mieści się na ekranie mobilnym.

## Czego teraz nie robimy

- pełnego rewrite do Reacta,
- zmiany wszystkich plików JavaScript na TypeScript,
- wymiany Supabase,
- zmiany schematu istniejących sesji bez potrzeby,
- jednorazowego dodania kilku tysięcy kart.
