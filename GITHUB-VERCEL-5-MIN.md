# GitHub i Vercel — szybka publikacja

## GitHub Desktop

1. **File → Add local repository**.
2. Wskaż folder `miedzy-nami-v0.7`.
3. Gdy program zaproponuje utworzenie repozytorium, zaakceptuj.
4. Commit: `feat: add v0.7 two-phone cloud mode`.
5. Kliknij **Publish repository**.

## Vercel

1. **Add New → Project**.
2. Importuj repozytorium GitHub.
3. Framework Preset: **Other**.
4. Build Command: puste.
5. Output Directory: puste.
6. Kliknij **Deploy**.

## Po deployu

Skopiuj domenę Vercela do Supabase:

- Authentication → URL Configuration → Site URL,
- Redirect URLs z końcówką `/**`.

Potem przetestuj dwa różne konta na dwóch telefonach.
