# Między Nami v0.9.0

PWA dla par z pulpitem gier, Codziennym Dopasowaniem, osobnymi kontami i synchronizacją dwóch telefonów.

**Aplikacja stworzona przez Michała Czerwińskiego.**

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
- bezpieczne aktualizacje PWA, stan offline i przyjazne błędy,
- działanie lokalne bez konta.

## Fundament v0.9

Aplikacja jest teraz budowana przez Vite i TypeScript:

- `main.ts` jest jednym punktem wejścia,
- klient Supabase jest przypięty jako zależność npm,
- dotychczasowe moduły są uruchamiane w kontrolowanej kolejności,
- Vite tworzy produkcyjny katalog `dist`,
- Service Worker automatycznie buforuje hashowane pliki buildu.

Migracja jest etapowa. Pliki `v05.js`–`v083.js` pozostają aktywne, ale kolejne wersje będą przenosiły ich logikę do modułów TypeScript bez jednorazowego przepisywania całej aplikacji.

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
