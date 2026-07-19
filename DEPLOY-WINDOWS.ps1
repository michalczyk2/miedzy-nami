$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "`nMiędzy Nami — kontrola projektu" -ForegroundColor Magenta
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Brakuje Node.js. Zainstaluj wersję LTS z https://nodejs.org i uruchom plik ponownie." -ForegroundColor Red
  Read-Host "Enter, aby zamknąć"
  exit 1
}
npm run check
Write-Host "`nLogowanie i wdrożenie na Vercel..." -ForegroundColor Magenta
Write-Host "Przy pierwszym uruchomieniu wybierz swoje konto i zaakceptuj domyślne ustawienia projektu." -ForegroundColor Yellow
npx --yes vercel@latest --prod
Write-Host "`nGotowe. Adres produkcyjny pojawił się powyżej." -ForegroundColor Green
Read-Host "Enter, aby zamknąć"
