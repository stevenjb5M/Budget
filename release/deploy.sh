#!/bin/bash

# Budget Planner Release Deployment Script
# This script helps deploy the Budget Planner application

echo "🚀 Starting Budget Planner deployment..."

# Check if we're in the release directory
if [ ! -f "BudgetPlanner.API" ]; then
    echo "❌ Error: Please run this script from the release directory"
    exit 1
fi

# Set permissions for the backend executable
chmod +x BudgetPlanner.API

# Start the backend API (assuming port 5000)
echo "🖥️  Starting backend API..."
./BudgetPlanner.API --urls=http://0.0.0.0:5000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Serve the frontend (you may need to install a static file server like nginx)
echo "📱 Frontend is ready in the 'frontend' directory"
echo "   You can serve it using any static file server (nginx, apache, etc.)"
echo "   pointing to the 'frontend' directory"

echo "✅ Deployment complete!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend: ./frontend/"
echo ""
echo "To stop the backend, run: kill $BACKEND_PID"