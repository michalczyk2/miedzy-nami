@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Brakuje Node.js. Zainstaluj wersje LTS z https://nodejs.org & pause & exit /b 1)
call npm run check
pause
