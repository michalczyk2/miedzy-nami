# Między Nami v0.9.9 — centrum gier online

## Cel

Dotychczas każdy moduł live dodawał własny baner aktywnej sesji. Przy kilku rozpoczętych grach pulpit stawał się długi i nie było jednego miejsca pokazującego stan wszystkich rozgrywek.

## Nowy moduł

`v099.js` tworzy widok `v099-online-center` i pobiera sesje pary bezpośrednio z `multiplayer_sessions` z zachowaniem istniejącego RLS.

Centrum obejmuje:

- Dopasowanie 18+,
- Ochotę na dziś,
- Kto bardziej?,
- Znasz mnie?,
- Co wybierasz?,
- Skalę 1–10,
- rozpoczęte Codzienne Dopasowanie.

## Pulpit

Osobne banery modułów v0.9.3–v0.9.8 są usuwane po renderze. Zastępuje je jedna karta pokazująca liczbę aktywnych gier i skrócony wykaz nazw. `MutationObserver` zapobiega ponownemu pojawieniu się starszych banerów po asynchronicznym odświeżeniu konkretnej gry.

## Prywatność

Centrum wyświetla wyłącznie nazwę gry, stan sesji, liczbę kart i autora rozpoczęcia. Nie pobiera ani nie pokazuje treści prywatnych odpowiedzi. Otworzenie wyniku nadal odbywa się w module konkretnej gry i podlega dotychczasowym zasadom RLS.

## Backend

v0.9.9 nie wymaga migracji SQL. Korzysta wyłącznie z istniejących tabel, RPC i polityk bezpieczeństwa.
