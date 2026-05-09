#!/bin/bash
echo "Starting Grace Music Academy..."
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "  App is running!"
echo "=========================================="
echo ""
echo "Open in browser: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
