@echo off
chcp 65001 >nul
cls
echo ================================================
echo     🪙  Obuhov Coin Server Launcher
echo ================================================
echo.

REM Перевірка наявності Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не знайдено!
    echo 📥 Будь ласка, встановіть Node.js з https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js знайдено
node --version
echo.

REM Перевірка наявності node_modules
if not exist "node_modules" (
    echo 📦 Встановлення залежностей...
    echo.
    call npm install
    echo.
)

echo 🚀 Запуск сервера на порту 28015...
echo.
echo 🌐 Доступ до сервера:
echo    📍 Локально:  http://localhost:28015
echo    🌍 Публічно:  http://176.36.103.4:28015
echo.
echo 💡 Інші користувачі можуть підключатись через:
echo    http://176.36.103.4:28015
echo.
echo 🛑 Для зупинки сервера натисніть Ctrl+C
echo ================================================
echo.

REM Запуск сервера
node server.js

pause
