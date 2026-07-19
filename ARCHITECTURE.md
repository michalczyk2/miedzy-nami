# Architektura Między Nami v0.7.1

## Frontend

Statyczne PWA HTML/CSS/JavaScript wdrażane na Vercel. Warstwy runtime:

- `app.js` — podstawowy silnik gier,
- `enhancements.js`, `v05.js`, `v06.js` — rozwój funkcji lokalnych, pulpit i Codzienne Dopasowanie,
- `v07.js` — logowanie, para, synchronizacja i historia online,
- `v071.js` — produkcyjny UX konta, uporządkowane menu oraz obsługa powrotów z logowania.

## Backend

Dedykowany projekt Supabase:

- Supabase Auth — osobne konta obu osób,
- PostgreSQL — profile, para, odpowiedzi i wyniki,
- Row Level Security — dostęp wyłącznie dla członków pary,
- Realtime — automatyczne wykrycie odpowiedzi partnera.

Publiczny `publishable key` znajduje się w frontendzie. Klucze `secret` i `service_role` nie są używane.

## Tryb bez konta

Wszystkie dotychczasowe gry pozostają dostępne lokalnie. Konto jest wymagane wyłącznie do synchronizacji między urządzeniami.
