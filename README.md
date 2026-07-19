# Między Nami v0.7.1

PWA dla par z pulpitem gier, Codziennym Dopasowaniem, kontami Supabase i synchronizacją dwóch telefonów.

**Aplikacja stworzona przez Michała Czerwińskiego.**

## Najważniejsze funkcje

- 754 karty w 10 mechanikach gry,
- 180 pytań Codziennego Dopasowania,
- konta osobne dla obu osób,
- kod łączący parę,
- odpowiedzi ukryte do ukończenia zestawu przez oboje,
- wspólny wynik i historia online,
- czytelny profil konta w nagłówku,
- uporządkowane menu,
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

## Wersja produkcyjna

Automatyczne wdrożenia realizowane są przez Vercel z gałęzi `main`.