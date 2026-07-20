# Changelog

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
