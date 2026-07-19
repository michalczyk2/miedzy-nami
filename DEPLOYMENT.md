# Wdrożenie Między Nami v0.7

## Przed publikacją

```bash
npm install
npm run check
```

## GitHub

Repozytorium może być publiczne. `cloud-config.js` zawiera wyłącznie URL projektu i publishable key, które są przeznaczone dla frontendu. Nie wolno commitować klucza `service_role`.

## Vercel

Projekt jest statyczny. W Vercel nie wybieraj frameworka, a Root Directory ustaw na katalog zawierający `index.html`.

Po pierwszym deployu wpisz domenę Vercela do Supabase Authentication URL Configuration. Bez tego link logowania może wracać pod niewłaściwy adres.

## Kolejność produkcyjna

1. Utworzenie osobnego Supabase.
2. Migracja SQL.
3. Uzupełnienie `cloud-config.js`.
4. `npm run check`.
5. Commit i push GitHub.
6. Deploy Vercel.
7. Konfiguracja Site URL i Redirect URLs w Supabase.
8. Test dwóch kont na dwóch telefonach.
