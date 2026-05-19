@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Assistance Platform - E2E Test Suite
echo ========================================
echo.
echo  What these tests verify:
echo.
echo  Suite 1 - Happy Path (35 assertions)
echo    Simulates a real case from start to finish:
echo    - An applicant submits a request for help
echo    - A case manager picks it up and advances it to compliance review
echo    - Compliance marks it ready
echo    - The president approves it
echo    - The treasurer schedules the payment and marks it paid
echo    - The case closes as Completed
echo.
echo  Suite 2 - Edge Cases and Role Enforcement (18 assertions)
echo    Tests what the system correctly REJECTS:
echo    - President rejects a case (rejection path)
echo    - President puts a case on hold (PENDING_INFO path)
echo    - A case manager tries to do a compliance action (blocked)
echo    - Invalid input is rejected with an error
echo.
echo  Suite 3 - Extended Coverage (36 assertions)
echo    Tests all the guards and edge cases:
echo    - Tampered login token is rejected
echo    - Admin can create, update, and deactivate users
echo    - A deactivated account cannot log in
echo    - Admin cannot deactivate their own account
echo    - Pagination limits are enforced
echo    - A case manager cannot assign to someone elses case
echo    - Compliance officer cannot approve or reject
echo    - Double disbursement and double-pay are blocked
echo    - Full PENDING_INFO re-review path works end to end
echo.
echo  Total: 89 assertions across all three suites
echo.
echo ========================================
echo.

:: Find Git Bash
set "BASH="
if exist "C:\Program Files\Git\bin\bash.exe" set "BASH=C:\Program Files\Git\bin\bash.exe"
if exist "C:\Program Files (x86)\Git\bin\bash.exe" set "BASH=C:\Program Files (x86)\Git\bin\bash.exe"
if not defined BASH (
  echo ERROR: Git Bash not found.
  echo Install Git for Windows from https://git-scm.com and try again.
  echo.
  pause & exit /b 1
)

:: Check backend is running
echo Checking backend is running on http://localhost:3000 ...
curl -s --max-time 5 http://localhost:3000/api/auth/me >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: Backend is not responding on port 3000.
  echo.
  echo Please double-click start.bat first to launch the servers,
  echo wait about 5 seconds for them to start, then run this file again.
  echo.
  pause & exit /b 1
)
echo Backend is up.
echo.

cd /d "%~dp0"

:: ── Suite 1 ─────────────────────────────────────────────────────────────────
echo ========================================
echo  Suite 1 of 3 - Happy Path
echo ========================================
echo.
"%BASH%" "%~dp0e2e_test.sh"
echo.

:: ── Suite 2 ─────────────────────────────────────────────────────────────────
echo ========================================
echo  Suite 2 of 3 - Edge Cases and Role Enforcement
echo ========================================
echo.
"%BASH%" "%~dp0e2e_edge_test.sh"
echo.

:: ── Suite 3 ─────────────────────────────────────────────────────────────────
echo ========================================
echo  Suite 3 of 3 - Extended Coverage
echo ========================================
echo.
"%BASH%" "%~dp0e2e_extended_test.sh"
echo.

echo ========================================
echo  All suites complete.
echo  Expected: 89 PASS, 0 FAIL
echo  Scroll up to review any [FAIL] lines.
echo ========================================
echo.
pause
