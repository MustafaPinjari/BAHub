@echo off
echo ===================================================
echo             Starting BAHub SaaS Workspace          
echo ===================================================
echo.
echo Press Ctrl+C in this terminal window to stop both servers.
echo.

:: Start Django Backend in the background of the same console
echo Starting Django Backend on http://127.0.0.1:8000/ ...
start /B cmd /c "cd backend && call venv\Scripts\activate && python manage.py runserver"

:: Wait a brief moment for Django to initialize
timeout /t 2 >nul

:: Start Vite React Frontend in the foreground
echo Starting Vite React Frontend on http://localhost:5173/ ...
cd frontend && npm run dev
