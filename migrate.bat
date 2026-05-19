@echo off
echo ========================================
echo  Assistance Platform - Apply Migration
echo  Adds: Google Sign-In + email verification
echo ========================================
echo.

cd /d "%~dp0backend"

echo [1/3] Installing new backend dependencies (google-auth-library)...
call npm install
if errorlevel 1 (echo ERROR: npm install failed & pause & exit /b 1)

echo.
echo [2/3] Running database migration...
call npx prisma migrate dev --name add-google-auth
if errorlevel 1 (echo ERROR: Migration failed - is the database running? & pause & exit /b 1)

echo.
echo [3/3] Re-seeding to mark existing users as email-verified...
call npm run db:seed
if errorlevel 1 (echo ERROR: Seed failed & pause & exit /b 1)

echo.
echo ========================================
echo  Migration complete!
echo.
echo  NEXT STEP (optional): To enable Google Sign-In,
echo  set GOOGLE_CLIENT_ID in backend\.env
echo  and VITE_GOOGLE_CLIENT_ID in frontend\.env
echo ========================================
pause
