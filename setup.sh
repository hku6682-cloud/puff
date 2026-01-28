#!/bin/bash

# PUFF Platform - Complete Setup Script

echo "🚀 Starting PUFF Platform Setup..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+"
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend
npm install

# Ask for database details
echo ""
echo "🗄️  Setting up database configuration..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "Created .env file. Please update DB_* variables with your database credentials."
fi

cd ..

# Frontend setup
echo ""
echo "⚛️  Setting up frontend..."
cd frontend
npm install

if [ ! -f ".env" ]; then
    cp .env.example .env
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your database credentials"
echo "2. In terminal 1: cd backend && npm run dev"
echo "3. In terminal 2: cd frontend && npm run dev"
echo "4. Open http://localhost:5173 in your browser"
