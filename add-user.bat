@echo off
echo ========================================
echo  Adding user: Arsh Anwari
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/2] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (echo ERROR: Prisma generate failed & pause & exit /b 1)

echo.
echo [2/2] Adding user to database...
node scripts\add-arsh.js
if errorlevel 1 (echo. & echo ERROR: Script failed - see message above & pause & exit /b 1)

echo.
echo ========================================
echo  SUCCESS - You can now close this window
echo ========================================
pause
