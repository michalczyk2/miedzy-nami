# Między Nami v0.8.0

PWA dla par z pulpitem gier, Codziennym Dopasowaniem, kontami Supabase i synchronizacją dwóch telefonów.

**Aplikacja stworzona przez Michała Czerwińskiego.**

## Najważniejsze funkcje

- 754 karty w 10 mechanikach gry,
- 180 pytań Codziennego Dopasowania,
- konta osobne dla obu osób,
- logowanie kodem OTP wpisywanym bezpośrednio w PWA,
- kod łączący parę,
- odpowiedzi ukryte do ukończenia zestawu przez oboje,
- wspólny wynik i historia online,
- czytelny profil konta w nagłówku,
- onboarding prowadzący przez pierwszy start,
- trwałe zapamiętywanie sesji na urządzeniu,
- czytelny status pary i dzisiejszego zadania na pulpicie,
- zwarte menu mobilne z pomocą „Jak zacząć?”,
- PWA i działanie lokalne bez konta.

## Uruchomienie

```bash
npm run check
npm run preview
```

Podgląd lokalny: `http://localhost:3000`.

## Wdrożenie

```bash
npm run deploy
```

Na Windows możesz użyć `DEPLOY-WINDOWS.bat`. Po wdrożeniu dodaj adres Vercela w `Authentication → URL Configuration` w Supabase. Szczegóły znajdują się w `PRODUCTION-CHECKLIST.md`.


## Logowanie na iPhonie

Wersja 0.8.0 używa kodu jednorazowego z e-maila zamiast linku. Kod wpisuje się w skrócie Między Nami otwartym z ekranu głównego, dzięki czemu sesja zapisuje się dokładnie w aplikacji PWA.
