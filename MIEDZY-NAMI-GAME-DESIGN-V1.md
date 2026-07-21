# Między Nami — GAME DESIGN V1

**Projekt:** Między Nami  
**Punkt odniesienia:** produkcja v0.9.14  
**Etap:** stabilizacja i uporządkowanie mechanik przed rozbudową biblioteki  
**Status dokumentu:** PRZYGOTOWANE DO ZATWIERDZENIA  
**Cel:** ustalić ostateczne zasady każdej gry przed tworzeniem setek nowych kart.

---

## 1. Zasady nadrzędne

1. Nie usuwamy trybu jednego telefonu.
2. Gry, które mają sens jako prywatne odpowiedzi dwóch osób, mogą działać na jednym lub dwóch telefonach.
3. Partner nie musi mieć otwartej aplikacji podczas rozpoczęcia sesji online.
4. Odpowiedzi partnera pozostają ukryte do właściwego momentu odsłonięcia.
5. Treści 18+ nie trafiają do zwykłych losowań ani pakietów.
6. W trybach 18+ zawsze dostępne są: zgoda, pauza, pominięcie i przerwanie.
7. Nie zmieniamy istniejących identyfikatorów kart i sesji bez migracji zgodności.
8. Nie tworzymy 300 kart do mechaniki, która nie została wcześniej przetestowana na małym zestawie.
9. Nowe mechaniki wdrażamy pojedynczo, każdą w osobnej małej wersji.
10. Każda gra musi mieć wyraźny cel i nie może dublować innej gry.

---

## 2. Statusy mechanik

| Gra | Decyzja | Tryb | Priorytet |
|---|---|---|---|
| Znasz mnie | ZOSTAJE | 1–2 telefony | wysoki |
| Kto bardziej | ZOSTAJE | 1–2 telefony | wysoki |
| Wybór | ZOSTAJE | 1–2 telefony | wysoki |
| Skala | PRZEBUDOWA | 1–2 telefony | pierwszy prototyp |
| Fala | PROTOTYP UPROSZCZENIA | 1 telefon na start | po Skali |
| Plan | ZOSTAJE, trudniejsze karty | 1 telefon, online po audycie | wysoki |
| Słowa | PRZEBUDOWA | 1 telefon | średni |
| Historia | ZOSTAJE | 1 telefon | wysoki |
| Rozmowa | ZOSTAJE, wyraźne rozdzielenie | 1 telefon | wysoki |
| Wyzwania | OBECNE ZOSTAJĄ DO CZASU NOWEJ WERSJI | 1 telefon | później |
| Dylematy | NOWA GRA | 1–2 telefony | po podstawowych przebudowach |
| Dopasowanie 18+ | ZOSTAJE | 1–2 telefony | wysoki |
| Ochota na dziś | PRZEBUDOWA DO „NASTRÓJ NA DZIŚ” | 1–2 telefony | po głównych grach |
| Bez tabu | ROZBUDOWA | 1 telefon | wysoki |
| Tylko we dwoje | ROZBUDOWA | 1 telefon | wysoki |

---

# 3. Ostateczne założenia poszczególnych gier

## 3.1. Znasz mnie

### Cel
Sprawdzić, jak dobrze partner potrafi przewidzieć prawdziwą odpowiedź drugiej osoby.

### Przebieg rundy
1. Aplikacja wskazuje osobę odpowiadającą o sobie.
2. Ta osoba wybiera prawdziwą odpowiedź.
3. Partner wybiera odpowiedź, którą jego zdaniem zaznaczyła pierwsza osoba.
4. Odpowiedzi zostają odsłonięte razem.
5. Role zmieniają się automatycznie.

### Zasady treści
- 4 odpowiedzi, każda wiarygodna.
- Brak jednej oczywistej „normalnej” odpowiedzi.
- Pytania sytuacyjne i osobiste są ważniejsze niż fakty typu ulubiony kolor.
- Kategorie: codzienność, relacja, podróże, przyszłość, wartości, zabawne, romantyczne.
- Poziomy: lekki, osobisty, głębszy.

### Format karty
```ts
type KnowCard = {
  id: string;
  mode: "know";
  prompt: string;
  options: [string, string, string, string];
  category: Category;
  level: 1 | 2 | 3;
};
```

### Cel biblioteki
300 dobrych kart.

---

## 3.2. Kto bardziej

### Cel
Porównać, jak każda osoba postrzega role, zachowania i cechy w związku.

### Przebieg rundy
1. Oboje widzą to samo zdanie.
2. Każde prywatnie wybiera: osoba A, osoba B albo oboje.
3. Odpowiedzi odsłaniają się razem.
4. Aplikacja pokazuje zgodność.
5. Opcjonalna zachęta: „Podajcie po jednym przykładzie”.

### Zasady treści
- Pytanie musi realnie różnicować odpowiedzi.
- „Oboje” nie może być oczywistym wyborem w większości kart.
- Unikamy oskarżeń i pytań upokarzających.
- Kategorie: codzienność, zabawne, organizacja, emocje, podróże, relacja.

### Format karty
```ts
type WhoCard = {
  id: string;
  mode: "who";
  prompt: string;
  category: Category;
  level: 1 | 2 | 3;
};
```

### Cel biblioteki
300 kart.

---

## 3.3. Wybór

### Cel
Szybko porównać preferencje dwóch osób.

### Przebieg rundy
1. Oboje widzą pytanie i dwie opcje.
2. Każde odpowiada prywatnie.
3. Aplikacja odsłania oba wybory.
4. Zgodność jest informacją, a nie „dobrym wynikiem”.

### Różnica względem Dylematów
- Wybór: lekki i szybki.
- Dylemat: trudny, obie opcje mają realny koszt.

### Format karty
```ts
type ChoiceCard = {
  id: string;
  mode: "dilemma";
  prompt: string;
  options: [string, string];
  category: Category;
  level: 1 | 2 | 3;
};
```

### Cel biblioteki
300 kart.

---

## 3.4. Skala — nowa wersja

### Problem obecnej wersji
Zakres 1–10 jest zbyt wolny i daje pozorną precyzję. Mechanika niepotrzebnie zbliża się do Fali.

### Nowy cel
Szybko porównać stopień zgody, komfortu, częstotliwości albo intensywności.

### Nowy przebieg
1. Oboje widzą to samo pytanie.
2. Każde prywatnie wybiera wartość 1–5.
3. Po odpowiedzi obojga pojawiają się obie liczby.
4. Aplikacja pokazuje różnicę i krótki opis:
   - 0: bardzo podobnie,
   - 1: blisko,
   - 2: warto porozmawiać,
   - 3–4: widzicie to wyraźnie inaczej.
5. Bez wpisywania własnego tekstu.

### Rodzaje skali
```ts
type ScaleKind =
  | "agreement"
  | "likelihood"
  | "frequency"
  | "intensity"
  | "comfort";
```

### Podpisy
| Typ | 1 | 3 | 5 |
|---|---|---|---|
| agreement | zupełnie się nie zgadzam | trudno powiedzieć | zdecydowanie się zgadzam |
| likelihood | na pewno nie | możliwe | na pewno tak |
| frequency | nigdy | czasami | bardzo często |
| intensity | wcale | średnio | bardzo |
| comfort | bardzo niekomfortowe | neutralne | bardzo komfortowe |

### Format karty
```ts
type ScaleCardV2 = {
  id: string;
  mode: "scale";
  prompt: string;
  scaleKind: ScaleKind;
  category: Category;
  level: 1 | 2 | 3;
};
```

### Plan wdrożenia
Najpierw prototyp 20 kart. Dopiero po teście decyzja o 300 kartach.

---

## 3.5. Fala — uproszczony prototyp

### Cel
Jedna osoba próbuje przekazać pozycję na skali za pomocą przykładu, a partner ją odgaduje.

### Przebieg
1. Aplikacja pokazuje dwa przeciwne końce skali.
2. Pierwsza osoba widzi tajną wartość 1–5.
3. Podaje krótki przykład lub podpowiedź.
4. Partner wybiera pozycję 1–5.
5. Wynik odsłania się z animacją.
6. Role się zmieniają.

### Warunek dalszego rozwoju
20 kart testowych. Jeżeli gra nadal będzie zbyt skomplikowana lub mało atrakcyjna, zostaje ukryta zamiast rozbudowywana.

---

## 3.6. Plan

### Cel
Ocenić, czy atrakcyjna korzyść jest warta konkretnego kosztu.

### Przebieg
1. Aplikacja pokazuje kuszącą ofertę.
2. Pokazuje dwie korzyści.
3. Odsłania jeden trudny haczyk.
4. Każde wybiera: biorę / odpuszczam.
5. Odpowiedzi są porównywane.

### Standard jakości karty
- Oferta musi być naprawdę atrakcyjna.
- Haczyk musi realnie zmieniać decyzję.
- Odpowiedź nie może być oczywista.
- Karta nie może opierać się wyłącznie na absurdzie.

### Format
```ts
type PlanCard = {
  id: string;
  mode: "plan";
  title: string;
  positives: [string, string];
  twist: string;
  category: Category;
  level: 1 | 2 | 3;
};
```

### Tryb online
Możliwy dopiero po audycie wspólnego silnika sesji. Bez zakładania nowej migracji z góry.

---

## 3.7. Słowa — nowa wersja

### Problem obecnej wersji
Za dużo kroków: samodzielny wybór trzech słów, wymyślenie podpowiedzi i przekazywanie telefonu.

### Nowy przebieg
1. Aplikacja losuje planszę 9 słów.
2. Sama wskazuje osobie podpowiadającej 3 tajne słowa.
3. Osoba wpisuje jedno słowo jako podpowiedź.
4. Partner wybiera 3 słowa z planszy.
5. Każde trafienie daje punkt.

### Format planszy
```ts
type WordsBoard = {
  id: string;
  mode: "words";
  words: [string, string, string, string, string, string, string, string, string];
  category: Category;
  level: 1 | 2 | 3;
};
```

### Plan
Najpierw 30 ręcznie sprawdzonych plansz. Nie generujemy automatycznie tysięcy losowych połączeń bez kontroli jakości.

---

## 3.8. Historia

### Zakres
Wyłącznie przeszłość i wspólne doświadczenia:
- początki relacji,
- ważne chwile,
- wspomnienia,
- pierwsze razy,
- kryzysy, które przeszliście,
- wspólne rytuały,
- zabawne sytuacje.

### Nie umieszczamy
- ogólnych pytań o potrzeby,
- planów na przyszłość,
- pytań, które nie wymagają wspólnej historii.

### Cel biblioteki
300 kart.

---

## 3.9. Rozmowa

### Zakres
Teraźniejszość i przyszłość:
- potrzeby,
- emocje,
- granice,
- wsparcie,
- komunikacja,
- wartości,
- plany,
- oczekiwania.

### Różnica względem Historii
- Historia: „co przeżyliśmy?”
- Rozmowa: „co czujemy, czego potrzebujemy i dokąd zmierzamy?”

### Cel biblioteki
300 kart.

---

## 3.10. Wyzwania

### Stan przejściowy
Obecna gra pozostaje dostępna. Nie usuwamy jej przed ukończeniem nowej wersji.

### Docelowa mechanika
Tajne wyzwanie tygodnia:
1. Każda osoba dostaje własne tajne zadanie.
2. Ma kilka dni na wykonanie.
3. Partner może próbować rozpoznać, co było zadaniem.
4. Odsłonięcie następuje po wykonaniu albo po końcu tygodnia.
5. Punkty za wykonanie i poprawne odgadnięcie.

### Konsekwencje techniczne
- nowy stan długotrwałej sesji,
- data rozpoczęcia i wygaśnięcia,
- osobne prywatne dane każdej osoby,
- prawdopodobna migracja Supabase,
- później ewentualne przypomnienia PWA.

### Decyzja
Osobny etap po głównych grach. Nie dokładamy tego do przebudowy Skali.

---

## 3.11. Dylematy — nowa gra

### Cel
Postawić parę przed trudnym wyborem, w którym obie strony mają realną wartość i koszt.

### Różnica względem Wybierania
- Wybór: szybka preferencja.
- Dylemat: trudna decyzja wymagająca uzasadnienia.

### Identyfikator techniczny
`hard_choice`

Nie używamy `dilemma`, ponieważ obecna gra Wybór już korzysta z tego identyfikatora.

### Format
```ts
type HardChoiceCard = {
  id: string;
  mode: "hard_choice";
  prompt: string;
  optionA: {
    label: string;
    consequence: string;
  };
  optionB: {
    label: string;
    consequence: string;
  };
  category: Category;
  level: 2 | 3;
};
```

### Plan
Najpierw 30 kart i tryb jednego telefonu. Online dopiero po potwierdzeniu jakości mechaniki.

---

# 4. Pikantne 18+

## 4.1. Wspólne zasady bezpieczeństwa

- tylko pełnoletni użytkownicy,
- wspólna zgoda przed rozpoczęciem,
- przy każdej karcie dostępne „pomiń” i „pauza”,
- brak kary za odmowę,
- jasny opis zadania przed zgodą,
- treści 18+ przechowywane i losowane osobno,
- brak publikowania odpowiedzi w zwykłej historii,
- ustawienie maksymalnego poziomu treści.

## 4.2. Poziomy
1. Intymnie
2. Pikantnie
3. Odważnie
4. Bez cenzury

Poziom 4 domyślnie wyłączony.

---

## 4.3. Dopasowanie 18+

### Cel
Porównać preferencje i komfort bez bezpośredniego przechodzenia do zadań.

### Kategorie
- atmosfera,
- tempo,
- inicjowanie,
- komunikacja,
- sposób okazywania ochoty,
- rodzaj bliskości,
- komfort i granice.

### Cel biblioteki
300 pytań, ale poziomami i kategoriami.

---

## 4.4. Nastrój na dziś

Docelowa nazwa mechaniki zastępującej lub rozwijającej „Ochotę na dziś”.

### Cel
Sprawdzić aktualny nastrój i pokazać wyłącznie wspólne obszary.

### Obszary
- energia,
- chęć na bliskość,
- tempo,
- rodzaj dotyku,
- otwartość na coś nowego,
- rzeczy wykluczone na dziś.

### Zasada wyniku
Aplikacja nie pokazuje niezgodnych prywatnych odpowiedzi w sposób wywierający presję. Pokazuje:
- rzeczy wspólne,
- rzeczy do spokojnego ustalenia,
- brak wspólnej ochoty jako normalny wynik.

---

## 4.5. Bez tabu

### Cel
Rozmowa o seksualności, potrzebach, fantazjach i granicach.

### Treści
- fantazje,
- potrzeby,
- ulubione doświadczenia,
- ciekawość,
- komunikacja,
- granice,
- atrakcyjność,
- pożądanie.

### Format
Pytania otwarte, bez punktowania zgodności.

---

## 4.6. Tylko we dwoje

### Cel
Konkretne, wspólnie zaakceptowane działania.

### Wymagania jednej karty
- dokładnie opisane działanie,
- orientacyjny czas,
- poziom,
- wspólne „tak” przed startem,
- możliwość natychmiastowej pauzy,
- brak nieprecyzyjnych poleceń typu „partner może zrobić wszystko”.

### Format
```ts
type AdultActionCard = {
  id: string;
  mode: "adult_action";
  prompt: string;
  duration?: number;
  level: 1 | 2 | 3 | 4;
  requires?: string[];
  category: AdultCategory;
};
```

---

# 5. Standard biblioteki treści

## 5.1. Nie tworzymy jednego ogromnego pliku

Docelowo każda gra dostaje osobny moduł:

```text
content/
  know/
  who/
  choice/
  scale/
  wave/
  plan/
  words/
  story/
  talk/
  challenge/
  hard-choice/
  adult/
```

## 5.2. Zachowanie zgodności
- stare identyfikatory kart pozostają niezmienione,
- ulubione i ukryte karty nadal wskazują te same ID,
- nowe ID mają prefiks gry i numer paczki,
- usunięta karta nie jest automatycznie zastępowana inną pod tym samym ID.

## 5.3. Walidacja automatyczna
Build ma sprawdzać:
- unikalność ID,
- wymagane pola,
- poprawną liczbę odpowiedzi,
- dozwolone kategorie,
- dozwolony poziom,
- długość tekstu,
- identyczne pytania,
- bardzo podobne pytania,
- brak treści 18+ w zwykłych modułach,
- rozkład kategorii i poziomów.

## 5.4. Dodawanie treści paczkami
Każdą grę rozwijamy etapami:
- prototyp: 20–30,
- paczka 1: 50,
- paczka 2: 100,
- paczka 3: 150,
- paczka 4: 200,
- paczka 5: 250,
- paczka 6: 300.

Po każdej paczce raport jakości i test buildu.

---

# 6. Kolejność implementacji

1. Skala 1–5, prototyp 20 kart.
2. Plan, poprawa jakości istniejących scenariuszy.
3. Fala, prototyp uproszczonej mechaniki.
4. Słowa, plansze 9 słów.
5. Rozdzielenie treści Historia / Rozmowa.
6. Pikantne: poziomy i nowy standard treści.
7. Dylematy `hard_choice`.
8. Tajne wyzwanie tygodnia.
9. Rozbudowa bibliotek do 300 kart.
10. Pełny test regresji przed v1.0.

---

# 7. Następny konkretny etap

## Prototyp Skali 1–5

Zakres:
- bez usuwania starej biblioteki,
- 20 nowych kart testowych,
- nowy format `scaleKind`,
- jeden telefon i dwa telefony,
- prywatne odpowiedzi,
- wspólne odsłonięcie,
- brak migracji Supabase, jeżeli obecny zapis liczbowy obsłuży wartości 1–5,
- zachowanie kompatybilności ze starymi aktywnymi sesjami 1–10.

Przed implementacją trzeba wykonać audyt kodu `v098.js`, wspólnego silnika sesji i sposobu liczenia wyników. Dopiero wynik audytu zdecyduje, czy prototyp wejdzie jako nowa wersja Skali czy jako równoległy wariant kompatybilności.
