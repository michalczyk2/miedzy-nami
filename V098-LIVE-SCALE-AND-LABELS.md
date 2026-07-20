# Między Nami v0.9.8 — Skala online i oznaczenia trybów

## Zakres

1. `scale_live` — dziesięć kart skali 1–10 na dwóch telefonach.
2. Prywatne zaznaczenie wartości i jawne zatwierdzenie.
3. Odsłonięcie dopiero po ruchu obu osób.
4. Wynik każdej karty: dwie liczby, różnica i krótka interpretacja.
5. Podsumowanie: zgodność procentowa, liczba identycznych odpowiedzi, liczba różnic do dwóch punktów i średnia różnica.
6. Oznaczenie wszystkich ikon gry jako `1–2 TEL.` lub `1 TEL.`.
7. Legenda urządzeń nad siatką gier oraz etykiety w pakiecie Pikantne.

## Prywatność

Odpowiedź partnera pozostaje ukryta do momentu zapisania obu wartości. Nowa sesja `scale_live` zastępuje poprzednią sesję tego samego typu.

## Baza danych

Migracja `009_v098_live_scale_and_device_labels.sql`:

- dopisuje `scale_live` do `multiplayer_sessions.game_key`,
- utrzymuje limit dziesięciu pytań,
- rozszerza `multiplayer_live_answers.answer` do zakresu `0..9`,
- aktualizuje funkcje tworzenia sesji i zapisywania odpowiedzi.
