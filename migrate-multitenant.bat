@echo off
echo ============================================================
echo  Assistance Platform — Multi-Tenancy Migration
echo ============================================================
echo.
echo This script will:
echo   1. Install any missing backend dependencies
echo   2. Run the multi-tenancy database migration (adds
echo      Organization table + organizationId columns)
echo   3. Run the seed to create the default org and assign
echo      all existing data to it
echo.
echo The backend must NOT be running when you do this.
echo Close the backend server window before continuing.
echo.
pause

cd /d "%~dp0backend"

echo.
echo [1/3] Installing dependencies...
call npm install --silent
if errorlevel 1 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)

echo [2/3] Running migration...
call npx prisma migrate dev --name add-multi-tenancy
if errorlevel 1 (
  echo ERROR: Migration failed.
  pause
  exit /b 1
)

echo [3/3] Running seed (creates default org, backfills existing data)...
call npx prisma generate
call node -e "require('./prisma/seed.js')" 2>nul || call npx prisma db seed
if errorlevel 1 (
  echo ERROR: Seed failed.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  Migration complete!
echo ============================================================
echo.
echo  Default org slug: default
echo  Intake URL:       /apply/default
echo  Status URL:       /status/default
echo.
echo  To create a new organization, run add-org.bat
echo  (or insert directly into the Organization table in your DB)
echo.
pause
