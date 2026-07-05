@echo off
echo ===================================================
echo             Seeding BAHub Demo Workspace Data      
echo ===================================================
echo.

:: Check if backend directory exists
if not exist "backend" (
    echo [ERROR] Backend folder not found. Make sure you run this script from the workspace root.
    pause
    exit /b 1
)

echo Resetting local SQLite database...
cd backend

:: Flush existing tables
call venv\Scripts\python manage.py flush --no-input
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to flush the database. Ensure the server is stopped.
    cd ..
    pause
    exit /b 1
)

echo Loading demo workspace dataset (datadump.json)...
:: Load fixture
call venv\Scripts\python manage.py loaddata datadump.json
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to load data fixture.
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ===================================================
echo   Demo workspace data seeded successfully!         
echo ===================================================
echo.
pause
