#!/bin/bash

# Budget Planner - Offline Mode Launcher
# Double-click this script to run the app without terminal

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
PORT=4173

echo "🎯 Budget Planner - Offline Mode"
echo "================================="
echo ""

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$FRONTEND_DIR"
    npm install
    cd "$PROJECT_DIR"
fi

# Build if dist doesn't exist or is outdated
if [ ! -d "$DIST_DIR" ] || [ $(find "$FRONTEND_DIR/src" -newer "$DIST_DIR" -type f 2>/dev/null | wc -l) -gt 0 ]; then
    echo "🔨 Building app..."
    cd "$FRONTEND_DIR"
    npm run build > /dev/null 2>&1
    cd "$PROJECT_DIR"
    echo "✅ Build complete"
fi

# Kill any existing process on the port (gracefully)
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⏹️  Stopping previous server..."
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo ""
echo "🚀 Starting offline app..."
echo "📍 Opening http://localhost:$PORT"
echo ""
echo "✨ Your app is running!"
echo "📝 All data is stored locally in your browser"
echo ""
echo "⚠️  Keep this window open. Close it to stop the server."
echo ""

# Open browser
sleep 1
open "http://localhost:$PORT" 2>/dev/null || echo "Please open http://localhost:$PORT in your browser"

# Start server
cd "$DIST_DIR"
npx serve -p $PORT --single
