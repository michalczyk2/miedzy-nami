# Supabase — konfiguracja dwóch telefonów

## 1. Dedykowany projekt

Utwórz osobny projekt o nazwie `miedzy-nami`. Nie używaj projektu `typerzy-mundial-2026`, aby dane i polityki RLS pozostały całkowicie oddzielone.

Rekomendowany region dla Polski: Frankfurt (`eu-central-1`) lub inny najbliższy dostępny region UE.

## 2. Migracja bazy

W Supabase otwórz **SQL Editor**, wklej całą zawartość:

```text
supabase/migrations/001_v07_cloud.sql
```

i uruchom ją jeden raz.

Migracja tworzy:

- profile,
- pary i kody zaproszeń,
- członków pary,
- odpowiedzi dzienne,
- wyniki,
- historię sesji,
- funkcje tworzenia/dołączania/rozwiązywania pary,
- polityki RLS,
- Realtime.

## 3. Dane publiczne frontendu

W **Project Settings → API** skopiuj:

- Project URL,
- Publishable key.

Wklej do `cloud-config.js`:

```js
window.MN_CLOUD_CONFIG = {
  supabaseUrl: 'https://PROJECT.supabase.co',
  supabasePublishableKey: 'sb_publishable_...',
};
```

Nie używaj `service_role` ani żadnego sekretnego klucza.

## 4. Logowanie e-mail

W **Authentication → URL Configuration** ustaw:

- Site URL: produkcyjny adres Vercela,
- Redirect URLs: produkcyjny adres Vercela oraz adres preview/local, którego używasz.

Przykładowo:

```text
https://miedzy-nami.vercel.app/**
http://localhost:3000/**
```

## 5. Logowanie Google

Logowanie e-mailem działa bez Google. Aby włączyć przycisk Google:

1. skonfiguruj Google OAuth w panelu Google Cloud,
2. włącz dostawcę Google w **Authentication → Providers**,
3. dodaj callback URL pokazany przez Supabase.

## 6. Test na dwóch telefonach

1. Otwórz tę samą stronę na obu telefonach.
2. Na każdym wybierz **Konto pary i dwa telefony**.
3. Zaloguj każde konto innym adresem e-mail.
4. Na pierwszym telefonie utwórz parę.
5. Na drugim wpisz 6-znakowy kod.
6. Każda osoba odpowiada na swoim telefonie.
7. Po obu zgłoszeniach wynik odsłoni się na obu urządzeniach.

## 7. Kontrola bezpieczeństwa

Po migracji uruchom w Supabase:

- Security Advisor,
- Performance Advisor.

Wszystkie tabele aplikacji powinny mieć aktywne RLS.
