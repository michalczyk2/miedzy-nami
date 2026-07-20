# Między Nami v0.9.7 — „Co wybierasz?” na dwóch telefonach

## Zakres

- 10 dylematów z dokładnie dwiema opcjami.
- Jedna karta widoczna równocześnie na obu urządzeniach.
- Prywatne odpowiedzi do momentu ukończenia ruchu przez oboje.
- Jawne zaznaczenie A/B i osobny przycisk zatwierdzenia.
- Odsłonięcie wyniku po każdej karcie.
- Licznik zgodnych wyborów oraz końcowy procent zgodności.
- Wznowienie sesji przez 48 godzin i aktywny baner na pulpicie.
- Brak trwałej historii szczegółowych odpowiedzi; nowa sesja zastępuje poprzednią.

## Migracja

Przed wdrożeniem aplikacji należy jednokrotnie uruchomić `008_v097_live_choice.sql` w SQL Editorze Supabase.

Migracja jest addytywna: rozszerza dozwolone `game_key` oraz wspólne funkcje RPC o `dilemma_live`. Nie tworzy nowej tabeli i nie zmienia istniejących danych par.
