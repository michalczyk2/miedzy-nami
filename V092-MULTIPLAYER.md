# Między Nami v0.9.2 — wspólny silnik gier wyboru

## Zakres

Wersja dodaje drugi pełny tryb na dwóch telefonach: **Pikantne → Ochota na dziś**.

- 5 pytań losowanych z biblioteki,
- prywatne odpowiedzi na osobnych urządzeniach,
- ujawnienie dopiero po ukończeniu przez oboje,
- podsumowanie wspólnych i uzupełniających się wyborów,
- brak zapisu w ogólnej historii,
- jedna zachowana runda na grę.

## Fundament

`multiplayer-core-v092.js` skupia wspólne operacje klienta:

- dostęp do konta i pary,
- pobieranie sesji i odpowiedzi,
- Realtime,
- lokalny draft,
- tworzenie, wysyłanie i usuwanie sesji,
- przyjazne komunikaty błędów.

Migracja `004_v092_multiplayer_choice_engine.sql` dodaje generyczne RPC dla gier wyboru i zachowuje zgodność ze starymi funkcjami v0.9.1.
