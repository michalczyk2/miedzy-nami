# Między Nami v0.9.16 — spójna wersja i zgodność starej Skali

## Potwierdzone problemy

1. Menu pokazywało aktualną wersję, ale plakietka na pulpicie wracała do `v0.9.10`.
2. Stare, niedokończone sesje Skali 1–10 otwierały stary ekran i wyglądały jak obecna wersja gry.
3. Centrum online opisywało każdą sesję `scale_live` po prostu jako „Skala”, bez informacji o wersji mechaniki.

## Przyczyna

Moduł `v0910.js` po każdym renderze wpisywał własną wersję `0.9.10` do nagłówka pulpitu.
Nowszy moduł aktualizował menu, ale nie poprawiał pola `.desktop-welcome .eyebrow`.

Stare sesje zostały celowo zachowane, aby nie uszkodzić lokalnych i chmurowych danych. Ich wygląd nie informował jednak wystarczająco jasno, że korzystają ze starej mechaniki.

## Rozwiązanie

- aktualna wersja pochodzi z `MN_RELEASE` i jest poprawiana we wszystkich miejscach,
- kafelek Skali zawsze otwiera nowe lobby 1–5,
- stare sesje są oznaczone jako „Klasyczna Skala 1–10”,
- nowe sesje są oznaczone jako „Skala 1–5”,
- Centrum online rozpoznaje wersję po identyfikatorach `scale-v2-*`,
- stare sesje nie są automatycznie usuwane ani zmieniane,
- poprawki DOM są idempotentne, aby nie powtórzyć problemu z pętlą obserwatora.

## Baza danych

Brak zmian. Nie uruchamiaj SQL-a.

## Dane

Hotfix nie usuwa:
- niedokończonej sesji lokalnej,
- sesji online,
- kont,
- połączenia pary,
- odpowiedzi,
- statystyk.

## Commit

`fix: clarify legacy Scale sessions and version UI v0.9.16`

## Test po wdrożeniu

1. Pulpit i menu pokazują `v0.9.16`.
2. Niedokończona lokalna sesja ma etykietę starej Skali 1–10.
3. Centrum online rozróżnia Skalę 1–10 i Skalę 1–5.
4. Kliknięcie zwykłego kafelka Skali otwiera nowe lobby 1–5.
5. Dokończenie starej sesji nadal otwiera jej dawny ekran.
6. Po zakończeniu lub usunięciu starych sesji można rozpocząć nową Skalę 1–5.
