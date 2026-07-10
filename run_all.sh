#!/bin/bash
echo "==================================================="
echo "            Starting BAHub SaaS Workspace          "
echo "==================================================="
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Start Django Backend in background
echo "Starting Django Backend on http://127.0.0.1:8000/ ..."
(cd backend && source venv/bin/activate && python manage.py runserver) &
BACKEND_PID=$!

# Wait for Django to initialize
sleep 2

# Start Vite React Frontend in foreground
echo "Starting Vite React Frontend on http://localhost:5173/ ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Wait for both, kill both on Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
