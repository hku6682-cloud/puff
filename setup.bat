@echo off
REM PUFF Platform - Complete Setup Script for Windows

echo 🚀 Starting PUFF Platform Setup...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found

REM Backend setup
echo.
echo 📦 Setting up backend...
cd backend
call npm install

REM Create .env if doesn't exist
if not exist ".env" (
    copy .env.example .env
    echo Created .env file. Please update DB_* variables with your database credentials.
)

cd ..

REM Frontend setup
echo.
echo ⚛️  Setting up frontend...
cd frontend
call npm install

if not exist ".env" (
    copy .env.example .env
)

cd ..

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update backend\.env with your database credentials
echo 2. In terminal 1: cd backend ^&^& npm run dev
echo 3. In terminal 2: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:5173 in your browser
pause
