#!/bin/bash
echo "=========================================="
echo "  Grace Music Academy - Local Setup"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed!"
    echo "Install with: brew install python3"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Install with: brew install node"
    exit 1
fi

echo "[OK] Python3 found"
echo "[OK] Node.js found"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "To start the app:"
echo "  1. Start MongoDB (brew services start mongodb-community)"
echo "  2. Run: ./start_app.sh"
echo ""
