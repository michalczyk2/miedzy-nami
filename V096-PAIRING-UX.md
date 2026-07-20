# Między Nami v0.9.6 — łączenie pary i odpowiedzi online

## Model kodu

Kod nie należy do pojedynczego konta. Jest tworzony dla pary i po połączeniu obie osoby widzą ten sam kod. Kolumna `couples.invite_code` ma ograniczenie `unique`, a generator sprawdza bazę przed zapisaniem kodu.

## Nowy przepływ

1. Osoba, która otrzymała kod, wybiera „Mam kod partnera”, wkleja 6 znaków i łączy konto.
2. Tylko jedna osoba wybiera „Utwórz nową parę”.
3. Jeżeli obie osoby omyłkowo utworzyły własne puste pary, funkcja `switch_waiting_couple` atomowo usuwa pustą parę bieżącego użytkownika i dołącza go do kodu partnera.
4. Udostępnienie tworzy link z parametrem `?join=KOD`, który uzupełnia pole po otwarciu.

## Codzienne Dopasowanie online

- poprawne klasy `daily-answer-list` i `daily-answer`,
- litera i treść są rozdzielone oraz wyrównane,
- zaznaczona odpowiedź ma obramowanie i znacznik ✓,
- wybór nie przechodzi automatycznie do następnego pytania,
- przyciski „Dalej” oraz „Zatwierdź 5 odpowiedzi” są aktywne dopiero po wyborze.
