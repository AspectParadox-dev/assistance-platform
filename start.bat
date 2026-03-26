@echo off
echo ========================================
echo  Assistance Platform - Starting...
echo ========================================
echo.

echo Checking backend dependencies...
cd /d "%~dp0backend"
call npm install --silent
if errorlevel 1 (echo ERROR: Backend dependency install failed & pause & exit /b 1)

echo Checking frontend dependencies...
cd /d "%~dp0frontend"
call npm install --silent
if errorlevel 1 (echo ERROR: Frontend dependency install failed & pause & exit /b 1)

echo.
echo Backend will run on http://localhost:3000
echo Frontend will run on http://localhost:5173
echo.
echo Close either window to stop that server.
echo.

start "Backend - Assistance Platform" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend - Assistance Platform" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak >nul

start http://localhost:5173
