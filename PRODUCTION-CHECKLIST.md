# Między Nami v0.7.1 — lista produkcyjna

## Przed wdrożeniem

- `npm run check` kończy się bez błędów.
- Logowanie e-mail działa na `http://localhost:3000`.
- Jedno konto tworzy parę, drugie dołącza kodem.
- Oboje mogą odpowiedzieć na dzienne pytania i zobaczyć wspólny wynik.

## GitHub i Vercel

1. Opublikuj zawartość tego folderu w repozytorium `miedzy-nami`.
2. W Vercel wybierz **Add New → Project** i zaimportuj repozytorium.
3. Framework: **Other**, Build Command: puste, Output Directory: puste.
4. Po wdrożeniu skopiuj docelowy adres HTTPS.

## Supabase po wdrożeniu

W `Authentication → URL Configuration` ustaw:

- Site URL: docelowy adres Vercela,
- Redirect URLs:
  - `http://localhost:3000/**`
  - `https://TWOJ-ADRES.vercel.app/**`

## Test końcowy

- pierwszy telefon: logowanie i utworzenie pary,
- drugi telefon: logowanie i dołączenie kodem,
- osobne odpowiedzi,
- wynik odsłania się dopiero po odpowiedzi obojga,
- ponowne otwarcie aplikacji zachowuje sesję.
