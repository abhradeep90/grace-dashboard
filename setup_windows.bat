@echo off
echo ==========================================
echo   Grace Music Academy - Local Setup
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Python found
echo [OK] Node.js found
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
npm install
cd ..

echo.
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo To start the app:
echo   1. Start MongoDB (if using local database)
echo   2. Run: start_app.bat
echo.
pause
