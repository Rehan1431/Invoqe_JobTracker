@echo off
TITLE Invoqe Job Application Tracker (Task 3) - Windows Launcher
COLOR 0B

echo ==============================================================================
echo   INVOQE INTERNSHIP TASK 3: JOB APPLICATION TRACKER (WINDOWS LAUNCHER)
echo   PostgreSQL 18 ^| Pure TS TF-IDF ATS Scorer ^| Ollama Llama 3 ^| 24h Cron
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking PostgreSQL 18 Service...
sc query postgresql-x64-18 | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo     [OK] PostgreSQL 18 service is RUNNING.
) else (
    echo     [WARN] PostgreSQL 18 service not detected as running. Trying to start...
    net start postgresql-x64-18 >nul 2>&1
)

echo.
echo [2/4] Verifying Dependencies...
if not exist "backend\node_modules\" (
    echo     Installing backend dependencies...
    cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules\" (
    echo     Installing frontend dependencies...
    cd frontend && call npm install && cd ..
)
if not exist "node_modules\" (
    echo     Installing root dependencies...
    call npm install --save-dev concurrently
)

echo.
echo [3/4] Launching Express Backend Server (Port 5000)...
start "JobTracker - Backend (Express 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [4/4] Launching Vite React 18 Frontend (Port 5173)...
start "JobTracker - Frontend (Vite 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==============================================================================
echo   Servers are launching!
echo   Frontend Dashboard:  http://localhost:5173
echo   Backend REST API:    http://localhost:5000/api/applications
echo   Database:            PostgreSQL 18 (invoqe_job_tracker)
echo ==============================================================================
echo.
timeout /t 3 >nul
start http://localhost:5173
exit
