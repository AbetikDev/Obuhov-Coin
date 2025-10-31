@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo     ╔════════════════════════════════════════════════════════╗
echo     ║                                                        ║
echo     ║            🪙  OBUHOV COIN SERVER  🪙                  ║
echo     ║                                                        ║
echo     ║         Запуск серверної версії з SQLite БД            ║
echo     ║                                                        ║
echo     ╚════════════════════════════════════════════════════════╝
echo.
echo.
echo     📋 ЩО ПОТРІБНО ЗРОБИТИ:
echo.
echo     1️⃣  Оновити package.json (див. UPDATE_PACKAGE_JSON.md)
echo     2️⃣  Запустити install.bat
echo     3️⃣  Запустити start.bat
echo.
echo     🌐 Після запуску відкрийте: http://localhost:28015
echo.
echo     ════════════════════════════════════════════════════════
echo.
echo     ✨ НОВІ МОЖЛИВОСТІ:
echo.
echo     ✅ База даних SQLite на сервері
echo     ✅ Доступ з різних пристроїв
echo     ✅ Синхронізація даних в реальному часі
echo     ✅ Багатокористувацький режим
echo     ✅ Збереження історії транзакцій
echo.
echo     ════════════════════════════════════════════════════════
echo.
echo     📚 Документація:
echo.
echo        START_HERE.md        - Повна інструкція
echo        API_MIGRATION.md     - Інформація про API
echo        SERVER_README.md     - Документація сервера
echo        QUICK_START.md       - Швидкий старт
echo.
echo     ════════════════════════════════════════════════════════
echo.

pause

cls
echo.
echo     Відкриваємо START_HERE.md...
echo.

start "" START_HERE.md

timeout /t 2 /nobreak >nul
