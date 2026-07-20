# Między Nami v0.9.11

PWA dla par z pulpitem gier, Codziennym Dopasowaniem, osobnymi kontami i synchronizacją dwóch telefonów.

**Aplikacja stworzona przez Michała Czerwińskiego.**

## v0.9.11 — stabilizacja i wspólne statystyki

- naprawiono otwieranie gier online z pulpitu,
- dodano kontrolowany most stanu dla modułów multiplayer,
- wynik zwykłej gry rozegranej na jednym telefonie jest wysyłany do wspólnej historii pary,
- statystyki zwykłych sesji oraz Codziennego Dopasowania są widoczne na obu kontach,
- lokalne i chmurowe rekordy są deduplikowane,
- oznaczenia trybu w Pikantnych są małe i nie zasłaniają treści,
- aktualizacja nie wymaga zmian w bazie danych.

Szczegóły: `V0911-RUNTIME-AND-SHARED-STATS.md`.

## v0.9.10 — jedno centrum gier online

- wszystkie aktywne gry online są widoczne w jednym centrum,
- osobne banery sesji zostały zastąpione jedną kartą na pulpicie,
- centrum pokazuje również wyniki gotowe do obejrzenia,
- można wznowić albo usunąć sesję z obu telefonów,
- dodano skróty do rozpoczęcia każdej dostępnej gry online,
- rozpoczęte Codzienne Dopasowanie pojawia się w tym samym miejscu,
- aktualizacja nie wymaga zmian w bazie danych.

Szczegóły: `V099-ONLINE-CENTER.md`.

## v0.9.8 — Skala online i jasne oznaczenia trybów

- „Skala” działa na dwóch telefonach: oboje wybierają prywatnie wartość 1–10.
- Wynik odsłania liczby, różnicę i wspólne podsumowanie po 10 kartach.
- Każda ikona gry na pulpicie ma oznaczenie `1–2 TEL.` albo `1 TEL.`.
- Nad siatką gier znajduje się krótka legenda trybów.
- Gry Pikantne również pokazują, które podtryby działają online.

## v0.9.7 — prostsze łączenie pary i czytelne odpowiedzi

- pole do wpisania lub wklejenia kodu partnera jest teraz pierwszą opcją,
- zaproszenie można udostępnić jako link z kodem,
- jeżeli obie osoby utworzą osobne puste pary, jedna może bezpiecznie przełączyć się na kod partnera,
- po połączeniu aplikacja wyjaśnia, że oboje mają ten sam wspólny kod pary,
- odpowiedzi Codziennego Dopasowania online mają poprawny układ, odstępy i wyraźny stan zaznaczenia,
- przechodzenie między pytaniami odbywa się przyciskiem „Dalej”, a ostatni wybór jest widoczny przed zatwierdzeniem.

Szczegóły: `V096-PAIRING-UX.md`.

## v0.9.4 — Jak dobrze mnie znasz? na żywo

- prawdziwa odpowiedź jednej osoby i przewidywanie partnera na osobnych telefonach,
- automatyczna zmiana ról po każdej karcie,
- ukrycie odpowiedzi do wspólnego odsłonięcia,
- 10 kart, licznik trafień, podsumowanie i wznowienie przez 48 godzin,
- pełna zgodność z działającym trybem „Kto bardziej?”.

Szczegóły: `V094-LIVE-KNOW.md`.

## v0.9.3 — Kto bardziej? na żywo

- pierwszy zwykły tryb działający na dwóch telefonach,
- wspólna karta i prywatna odpowiedź na każdym urządzeniu,
- odsłonięcie wyniku po odpowiedzi obojga,
- blokada przeskakiwania i zmiany ujawnionej odpowiedzi,
- aktywna gra widoczna na ekranie głównym,
- automatyczne wznowienie przez 48 godzin,
- wspólny klient live do kolejnych gier.

Szczegóły: `V093-LIVE-WHO.md`.

## v0.9.2 — Ochota na dziś na dwóch telefonach

- 5 krótkich pytań na osobnych urządzeniach,
- ukryte odpowiedzi do wspólnego końca,
- wynik pokazuje przede wszystkim zgodne i uzupełniające się wybory,
- wspólny silnik `multiplayer-core-v092.js` oraz generyczne RPC dla kolejnych gier.

## Najważniejsze funkcje

- 866 kart w podstawowych i opcjonalnych trybach gry,
- 180 pytań Codziennego Dopasowania,
- osobne konta obu osób,
- logowanie kodem OTP bezpośrednio w PWA,
- kod łączący parę,
- odpowiedzi ukryte do ukończenia zestawu przez oboje,
- wspólny wynik i historia online,
- trwałe zapamiętywanie sesji na urządzeniu,
- pakiet Pikantne 18+ z czterema jasno opisanymi grami,
- Dopasowanie 18+ na dwóch telefonach z ukrytymi odpowiedziami i wspólnym wynikiem,
- bezpieczne aktualizacje PWA, stan offline i przyjazne błędy,
- działanie lokalne bez konta.

## Fundament v0.9

Aplikacja jest teraz budowana przez Vite i TypeScript:

- `main.ts` jest jednym punktem wejścia,
- klient Supabase jest przypięty jako zależność npm,
- dotychczasowe moduły są uruchamiane w kontrolowanej kolejności,
- Vite tworzy produkcyjny katalog `dist`,
- Service Worker automatycznie buforuje hashowane pliki buildu.

Migracja jest etapowa. Pliki `v05.js`–`v092.js` pozostają aktywne, ale kolejne wersje będą przenosiły ich logikę do modułów TypeScript bez jednorazowego przepisywania całej aplikacji.

## Uruchomienie

```bash
npm install
npm run dev
```

Podgląd deweloperski: `http://localhost:5173`.

## Kontrola i build

```bash
npm run check
npm run build
npm run preview
```

## Wdrożenie

Vercel korzysta z:

```bash
npm run build:prod
```

i publikuje katalog `dist`.

Ręczne wdrożenie z komputera:

```bash
npm run deploy
```

Po wdrożeniu adres produkcyjny musi pozostać dodany w `Authentication → URL Configuration` w Supabase.


## v0.9.7 — Co wybierasz? na dwóch telefonach

Tryb `dilemma` działa teraz online na dwóch urządzeniach. Każda osoba wybiera prywatnie jedną z dwóch opcji, jawnie zatwierdza wybór, a wynik karty jest odsłaniany dopiero po odpowiedzi obojga. Sesja ma 10 kart i może być wznowiona przez 48 godzin.


## v0.9.10

Audyt UX pulpitu, pakietów, gier Pikantnych i statystyk online.
