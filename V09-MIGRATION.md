# Między Nami v0.9.0 — migracja fundamentu

Ta wersja zachowuje istniejący interfejs i funkcje, ale zmienia sposób budowania aplikacji.

## Co jest nowe

- `main.ts` jest jedynym punktem wejścia przeglądarki.
- Supabase jest pobierany z przypiętej zależności npm.
- Starsze moduły są uruchamiane sekwencyjnie przez loader kompatybilności.
- Vite tworzy katalog `dist` z hashowanym modułem startowym.
- Service Worker otrzymuje listę hashowanych plików podczas budowania.

## Dlaczego pozostają pliki v05–v083

Migracja jest celowo etapowa. v0.9.0 najpierw wprowadza bezpieczny build. W kolejnych wersjach logika będzie przenoszona moduł po module do TypeScript, bez jednorazowego przepisywania całej aplikacji i ryzyka utraty działania.
