# Między Nami — audyt gry Plan V1

**Punkt odniesienia:** stabilna produkcja v0.9.14  
**Status:** PRZYGOTOWANE DO TESTU NA PREVIEW  
**Zakres:** wyłącznie zawartość gry Plan, bez Supabase, Service Workera i zmian mechaniki.

## Co potwierdzono w kodzie

- `app.js` zawiera 40 bazowych kart Plan.
- `enhancements.js` zawiera 20 kart `v03-plan-*`; `v03-plan-15` jest później usuwana jako duplikat.
- `content/cards-v05.js` dodaje 3 karty `v05-plan-*`.
- Mechanika korzysta z dwóch odpowiedzi: `Bierzemy` i `Odpuszczamy`.
- Dane karty mają pola: `title`, dwie `positives`, `twist`, `category`, `level`.

Na podstawie tych trzech źródeł potwierdzono **62 aktywne karty**. Interfejs użytkownika wcześniej pokazywał 70. Preview zapisuje rzeczywistą liczbę wykrytą w uruchomionej aplikacji jako `MN_PLAN_PREVIEW.previousPlanCount` i pokazuje ją na ekranie gry. Dzięki temu rozbieżność zostanie wyjaśniona bez zgadywania i bez dotykania produkcji.

## Najważniejszy problem biblioteki

Duża część scenariuszy ma bardzo mocną korzyść i lekki, zabawny haczyk. Przykłady obecnego schematu:

- darmowe wakacje, ale niewygodny szczegół,
- dom lub mieszkanie prawie za darmo, ale hałas albo drobne ograniczenie,
- ogromna nagroda, ale zabawna niedogodność,
- podobne warianty darmowych podróży, restauracji i zakupów.

W praktyce często wybiera się `Bierzemy` bez zastanowienia. To potwierdza ocenę użytkownika.

## Decyzje

### Zostaje bez zmian

- działająca mechanika jednego telefonu,
- kolejność odpowiedzi i ukrywanie pierwszego wyboru,
- punktacja za zgodność,
- format dwóch korzyści i jednego haczyka,
- wszystkie stare identyfikatory w produkcji.

### Nie robimy teraz

- trybu online,
- migracji Supabase,
- zmian Service Workera,
- usuwania starych kart z produkcji,
- zwiększania od razu do 300 kart.

## Standard jakości V1

Nowa karta przechodzi tylko wtedy, gdy:

1. oferta jest konkretna i atrakcyjna,
2. haczyk ma realny koszt w czasie, wolności, relacji, finansach albo codzienności,
3. obie odpowiedzi są rozsądne,
4. karta nie powtarza znaczeniowo innej,
5. tekst mieści się na ekranie telefonu,
6. poziom 1–3 odpowiada trudności decyzji.

## Pierwsza paczka

Preview zastępuje bibliotekę Plan zestawem **40 nowych scenariuszy**. Produkcja pozostaje nietknięta. Po kilku pełnych rozgrywkach ocenimy:

- ile kart wymagało realnego zastanowienia,
- ile razy odpowiedzi były różne,
- które haczyki były za słabe lub za mocne,
- czy poziomy 1–3 są dobrze rozłożone.

## Kryterium przejścia dalej

Co najmniej 28 z 40 kart powinno wywoływać realny wybór, rozmowę albo różne odpowiedzi. Dopiero wtedy przygotujemy drugą paczkę i plan dojścia do 100, a następnie 300 kart.
