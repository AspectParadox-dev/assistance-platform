@echo off
echo ========================================
echo  Assistance Platform - First Time Setup
echo ========================================
echo.

echo [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
call npm install
if errorlevel 1 (echo ERROR: Backend install failed & pause & exit /b 1)

echo.
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (echo ERROR: Frontend install failed & pause & exit /b 1)

echo.
echo [3/4] Generating Prisma client...
cd /d "%~dp0backend"
call npm run db:generate
if errorlevel 1 (echo ERROR: Prisma generate failed & pause & exit /b 1)

echo.
echo [4/4] Running database migrations and seed...
echo When prompted for a migration name, type: init
call npm run db:migrate
call npm run db:seed

echo.
echo ========================================
echo  Setup complete! Run start.bat to launch.
echo ========================================
pause
