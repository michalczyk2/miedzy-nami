# Między Nami v0.9.15 — audyt i prototyp Skali 1–5

## Punkt wyjścia

- produkcja przed zmianą: v0.9.14,
- obecna Skala online: 10 pytań, odpowiedzi zapisywane jako liczby `0–9`,
- obecna Skala lokalna korzystała z mechaniki tajnej liczby i zgadywania, przez co dublowała Falę.

## Audyt repozytorium

### Frontend online

`v098.js`:
- używa `game_key = scale_live`,
- tworzy 10-pytaniową sesję,
- zapisuje odpowiedzi jako indeksy `0–9`,
- pokazuje partnera dopiero po odpowiedzi obojga,
- identyfikuje pytania wyłącznie przez `question_ids`.

### Tryb lokalny

Stary silnik `app.js` obsługuje zarówno Falę, jak i Skalę przez ten sam typ `scale`.
Obie mechaniki używają:
- tajnej liczby 1–10,
- wpisanej podpowiedzi,
- zgadywania wartości przez drugą osobę.

Dlatego nowa Skala nie powinna być dopisywana do tej samej funkcji bez rozdzielenia mechanik.

## Audyt produkcyjnego Supabase

Sprawdzenie wykonano wyłącznie odczytowo.

Potwierdzono:
- `scale_live` jest dozwolonym typem sesji,
- sesja Skali wymaga 10 identyfikatorów pytań,
- tabela odpowiedzi dopuszcza zakres `0–9`,
- funkcja zapisu dla `scale_live` dopuszcza maksymalnie wartość 9,
- wartości `0–4` nowej Skali mieszczą się w obecnym schemacie,
- odpowiedź partnera jest zwracana dopiero wtedy, gdy obie osoby odpowiedziały,
- w momencie audytu nie było żadnej zapisanej sesji `scale_live`.

## Decyzja o bazie

**Nie jest potrzebna migracja SQL.**

Nowy prototyp nadal korzysta z:
- `game_key = scale_live`,
- 10 pytań na sesję,
- istniejących funkcji Supabase,
- obecnego mechanizmu Realtime i ukrywania odpowiedzi.

## Zgodność ze Skalą 1–10

Schemat sesji nie ma osobnego pola wersji. Wersja mechaniki jest więc rozpoznawana po identyfikatorach pytań:

- stare pytania: dotychczasowe ID,
- nowe pytania: prefiks `scale-v2-`.

Jeżeli między audytem a wdrożeniem powstanie stara sesja 1–10, aplikacja:
- rozpozna ją jako starą,
- otworzy dotychczasowy ekran `v098`,
- nie przeliczy jej jako Skali 1–5.

## Implementacja prototypu

- 20 nowych pytań zapisanych w module TypeScript,
- pięć rodzajów skali: zgoda, prawdopodobieństwo, częstotliwość, intensywność i komfort,
- każda sesja losuje 10 z 20 pytań,
- tryb online na dwóch telefonach,
- nowy tryb lokalny z przekazywaniem telefonu,
- odpowiedzi od 1 do 5,
- wspólne odsłonięcie i różnica 0–4,
- osobny lokalny zapis prototypu,
- stara lokalna sesja 1–10 nadal może zostać dokończona.

## Zmienione pliki

- `main.ts`
- `index.html`
- `sw.js`
- `package.json`
- `package-lock.json`
- `release.js`
- `version.json`
- `manifest.webmanifest`
- `scale-v2-content.ts`
- `v0915.js`
- `v0915.css`
- `multiplayer-v0915.test.mjs`
- `V0915-SCALE-AUDIT.md`

## Dane

- brak usuwania danych lokalnych,
- brak zmian w kontach i parach,
- brak migracji bazy,
- brak zmiany istniejących identyfikatorów kart,
- brak zmiany danych innych gier.

## Test po wdrożeniu

### Jeden telefon
1. Otwórz Skalę.
2. Wybierz tryb jednego telefonu.
3. Osoba pierwsza wybiera poziom.
4. Po przekazaniu telefonu jej wybór nie może być widoczny.
5. Osoba druga odpowiada.
6. Sprawdź wynik i przejście do kolejnego pytania.
7. Zamknij PWA w połowie i sprawdź wznowienie.

### Dwa telefony
1. Rozpocznij Skalę na jednym telefonie.
2. Drugi telefon może dołączyć później.
3. Odpowiedź partnera musi być ukryta.
4. Po odpowiedzi obojga mają pojawić się wartości 1–5 i różnica.
5. Dokończ 10 pytań i sprawdź podsumowanie.
6. Sprawdź Centrum online i wznowienie po zamknięciu PWA.

### Regresja
- Znasz mnie,
- Kto bardziej,
- Wybór,
- Pikantne,
- Codzienne Dopasowanie,
- powrót do pulpitu.

## Commit

`feat: add safe Scale 1-5 prototype v0.9.15`

## Rollback

Przywróć commit v0.9.14. Nie cofaj żadnej migracji, ponieważ v0.9.15 nie zmienia bazy.

## Uwaga o położeniu modułu

Pierwszy moduł TypeScript znajduje się w głównym katalogu jako `scale-v2-content.ts`, aby wszystkie pliki dało się bezpiecznie wgrać z iPhone’a jednym formularzem GitHuba. Jest niezależnym modułem i może zostać przeniesiony do docelowego katalogu podczas późniejszej migracji wykonywanej narzędziem z pełną obsługą folderów.
