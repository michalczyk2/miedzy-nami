# Między Nami v0.9.4 — „Jak dobrze mnie znasz?” na dwóch telefonach

## Cel wydania

v0.9.4 dodaje drugą zwykłą grę korzystającą z synchronizacji karta po karcie. W każdej rundzie jedna osoba odpowiada o sobie, a partner próbuje przewidzieć jej wybór. Role zmieniają się automatycznie po każdej karcie.

## Przebieg rozgrywki

1. Jedna osoba rozpoczyna wspólną sesję 10 kart.
2. Pierwsza karta dotyczy osoby o niższym `role_index` w parze.
3. Osoba, której dotyczy pytanie, wybiera prawdziwą odpowiedź na swoim telefonie.
4. Partner na drugim telefonie wskazuje przewidywaną odpowiedź.
5. Do chwili odpowiedzi obojga wybór partnera pozostaje ukryty.
6. Po odsłonięciu aplikacja pokazuje prawdę, przewidywanie i informację o trafieniu.
7. Na następnej karcie role zamieniają się.
8. Po 10 kartach oba telefony pokazują wspólny wynik.

## Bezpieczeństwo stanu

- serwer blokuje odpowiadanie na przyszłe pytania,
- odsłoniętej odpowiedzi nie można zmienić,
- sesja wygasa po 48 godzinach,
- nowa sesja zastępuje poprzedni wynik tego trybu,
- odpowiedzi nie trafiają do ogólnej historii,
- rola osoby odpowiadającej jest deterministyczna i identyczna na obu urządzeniach.

## Warstwa danych

Migracja `006_v094_live_know_me.sql`:

- dodaje `know_live` do `multiplayer_sessions`,
- rozszerza wspólne RPC live o drugi typ gry,
- dopuszcza cztery warianty odpowiedzi w `know_live`,
- zachowuje dotychczasowe zasady RLS, maskowania i Realtime,
- pozostaje zgodna z działającym `who_live`.

## Warstwa klienta

- `multiplayer-live-core-v093.js` pozostaje wspólnym transportem RPC i Realtime,
- `v094.js` obsługuje role, ekran prawdy lub przewidywania, odsłonięcie i podsumowanie,
- `multiplayer-v094.test.mjs` weryfikuje kontrakt migracji i klienta.
