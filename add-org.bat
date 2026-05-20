@echo off
echo ============================================================
echo  Add New Organization
echo ============================================================
echo.
echo This creates a new organization on the platform.
echo Each org gets its own intake URL and staff pool.
echo Data from different orgs is completely isolated.
echo.
set /p ORG_NAME=Enter organization name (e.g. Hope Foundation):
set /p ORG_SLUG=Enter URL slug (lowercase, hyphens only, e.g. hope-foundation):

echo.
echo Creating organization...
cd /d "%~dp0backend"
call npx prisma generate --silent
node scripts\add-org.js "%ORG_NAME%" "%ORG_SLUG%"
if errorlevel 1 (
  echo.
  echo Failed to create organization. See error above.
  pause
  exit /b 1
)
pause
