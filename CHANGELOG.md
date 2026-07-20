# Changelog

## 0.9.5 — niezawodne łączenie telefonów

- usunięto możliwość nieskończonego ekranu „Synchronizuję dane…”,
- dodano 12-sekundowe limity zapytań Supabase i 15-sekundowy watchdog interfejsu,
- inicjalizacja sesji i zdarzenie auth korzystają z jednej współdzielonej operacji,
- zapytania z `onAuthStateChange` są uruchamiane poza callbackiem auth,
- synchronizacja lokalnej historii działa w tle i nie blokuje ekranu konta,
- po błędzie dostępny jest przycisk „Spróbuj ponownie”,
- aktualizacja nie wymaga żadnej migracji SQL.

## 0.9.4

- Dodano „Jak dobrze mnie znasz?” na dwóch telefonach.
- Jedna osoba odpowiada o sobie, a partner przewiduje jej wybór.
- Role prawdy i zgadywania zmieniają się automatycznie co kartę.
- Odpowiedzi pozostają ukryte do ruchu obojga.
- Dodano wynik trafień, podsumowanie 10 kart i wznowienie aktywnej gry.
- Rozszerzono wspólny silnik live bez naruszania „Kto bardziej?”.
- Dodano migrację `006_v094_live_know_me.sql` i testy regresji.


## 0.9.3

- Dodano „Kto bardziej?” na dwóch telefonach w trybie karta po karcie.
- Odpowiedź partnera pozostaje ukryta do odpowiedzi obojga.
- Dodano osobną tabelę odpowiedzi na żywo, RPC i polityki RLS.
- Serwer blokuje przeskakiwanie pytań oraz zmianę ujawnionych odpowiedzi.
- Dodano baner aktywnej gry na ekranie głównym.
- Dodano wznowienie bieżącej karty i 48-godzinne sesje.
- Dodano wspólny klient `MN_LIVE_MULTIPLAYER_CORE`.
- Rozszerzono testy regresji i build produkcyjny.

## 0.9.2

- dodano „Ochota na dziś” na dwóch telefonach,
- dodano 5-pytaniowe prywatne rundy z wynikiem ujawnianym po ukończeniu przez oboje,
- dodano wspólny silnik klienta `multiplayer-core-v092.js`,
- dodano generyczne RPC i migrację `004_v092_multiplayer_choice_engine.sql`,
- zachowano zgodność ze wszystkimi sesjami v0.9.1.

## 0.9.1 — Dopasowanie 18+ na dwóch telefonach

- każda osoba odpowiada na swoim telefonie na ten sam zestaw 8 pytań,
- odpowiedzi partnera pozostają ukryte do ukończenia rundy przez oboje,
- wynik i porównanie odpowiedzi pojawiają się jednocześnie dzięki Supabase Realtime,
- aktywną rundę można kontynuować po zamknięciu aplikacji,
- zachowano wybór gry lokalnej na jednym telefonie,
- odpowiedzi 18+ nie trafiają do ogólnej historii i są usuwane przy nowej rundzie,
- dodano migrację `003_v091_spicy_match_two_phones.sql`.

## 0.8.3 — stabilizacja i optymalizacja PWA

- naprawiono ładowanie pełnego modułu v0.8.2 i rozjazd numerów wersji,
- dodano wspólny plik `release.js` oraz automatyczną kontrolę zgodności wydania,
- aktualizacja PWA czeka na decyzję użytkownika i nie przeładowuje aplikacji w trakcie gry,
- dodano czytelny stan offline/online i polskie komunikaty błędów sieciowych,
- zabezpieczono tworzenie oraz dołączanie do pary przed surowym `TypeError: Load failed`,
- dodano migrację `002_fix_invite_code.sql` do repozytorium,
- poprawiono górny safe area i cele dotykowe na iPhonie,
- dodano obsługę `prefers-reduced-motion`.

## 0.8.1 — Pikantne 18+

- dodano opcjonalny pakiet 112 kart dla pełnoletniej pary,
- trzy poziomy: Flirt, Pikantnie i Odważnie,
- ekran potwierdzenia 18+ i zasad dobrowolnej zgody,
- każdą kartę można pominąć bez tłumaczenia,
- pakiet jest domyślnie wyłączony i nie trafia do zwykłych szybkich gier,
- dodano skrót na pulpicie, w pakietach i w menu,
- zaktualizowano PWA do wersji 0.8.1.

## 0.7.2

- zastąpiono linki e-mail logowaniem kodem OTP wpisywanym bezpośrednio w aplikacji,
- rozwiązano problem osobnej sesji Safari i skrótu PWA na iPhonie,
- dodano ekran wpisywania kodu, zmianę adresu i ponowne wysłanie,
- dodano blokadę ponownej wysyłki przez 60 sekund,
- dodano polskie komunikaty dla limitu wiadomości i wygasłego kodu,
- zachowano sesję na urządzeniu po poprawnym zalogowaniu.

## 0.7.1

- dodano stale widoczny profil konta w nagłówku,
- dodano czytelny panel konta, status pary i ostatniej synchronizacji,
- przebudowano menu i podzielono je na trzy logiczne sekcje,
- dodano wyraźne statusy: tryb lokalny, konto online, oczekiwanie na partnera i aktywna synchronizacja,
- dodano obsługę oraz polskie komunikaty dla wygasłych linków logowania,
- dodano komunikat po udanym logowaniu i czyszczenie parametrów autoryzacji z adresu,
- poprawiono widok konta na telefonach,
- podłączono produkcyjny publiczny klucz Supabase,
- zachowano podpis autora: Michał Czerwiński.

## 0.7.0

- konta Supabase, kod pary i synchronizacja dwóch telefonów,
- wspólne Codzienne Dopasowanie i historia online,
- zabezpieczenia RLS oraz Realtime.

## 0.8.0 — intuicyjny start i trwałe konto

- nowe wprowadzenie przy pierwszym uruchomieniu,
- jasny wybór: jeden telefon albo dwa telefony,
- prowadzenie krok po kroku przez logowanie i połączenie pary,
- widoczna informacja, że sesja jest zapamiętana na urządzeniu,
- automatyczne przywracanie konta po ponownym otwarciu PWA,
- nowa karta stanu pary i dzisiejszego zadania na pulpicie,
- całkowicie przebudowane, zwarte menu mobilne,
- nowy ekran pomocy „Jak zacząć?”,
- czytelniejsze konto, synchronizacja i wylogowanie,
- poprawione odstępy, łamanie tekstu i widok na małych iPhone’ach.

## 0.9.0 — fundament Vite + TypeScript

- jeden modułowy punkt wejścia `main.ts` zamiast kilkunastu tagów `<script>`,
- kontrolowane, sekwencyjne uruchamianie dotychczasowych modułów,
- klient Supabase przypięty jako zależność npm zamiast niezablokowanego CDN,
- produkcyjny build Vite do katalogu `dist`,
- automatyczne dołączanie hashowanych zasobów Vite do Service Workera,
- TypeScript w trybie strict oraz kontrola `typecheck`,
- zachowany wygląd, dane lokalne, logowanie, para i wszystkie gry.
