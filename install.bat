@echo off
chcp 65001 >nul
cls
echo ================================================
echo     📦  Obuhov Coin - Встановлення залежностей
echo ================================================
echo.

REM Перевірка наявності Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не знайдено!
    echo.
    echo 📥 Завантажте та встановіть Node.js:
    echo    https://nodejs.org/
    echo.
    echo Після встановлення перезапустіть цей файл.
    pause
    exit /b 1
)

echo ✅ Node.js знайдено
node --version
npm --version
echo.

echo 📦 Встановлення залежностей...
echo.

call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo ✅ Залежності успішно встановлено!
    echo ================================================
    echo.
    echo 🚀 Тепер можете запустити сервер:
    echo    start.bat
    echo.
) else (
    echo.
    echo ================================================
    echo ❌ Помилка встановлення залежностей!
    echo ================================================
    echo.
)

pause
