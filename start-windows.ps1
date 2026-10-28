# ==============================================================================
# Invoqe Internship Task 3: Job Application Tracker
# Native Windows PowerShell Launcher Script
# ==============================================================================

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  INVOQE INTERNSHIP TASK 3: JOB APPLICATION TRACKER" -ForegroundColor Yellow
Write-Host "  PostgreSQL 18 | Pure TS TF-IDF ATS Scorer | Ollama Llama 3 | 24h Cron" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot
Set-Location $WorkspaceRoot

# 1. Check PostgreSQL 18 Service
Write-Host "`n[1/4] Checking PostgreSQL 18 Service..." -ForegroundColor White
$pgService = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq 'Running') {
    Write-Host "    [OK] PostgreSQL 18 service is RUNNING." -ForegroundColor Green
} else {
    Write-Host "    [WARN] Starting PostgreSQL 18 service..." -ForegroundColor Yellow
    Start-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
}

# 2. Check Dependencies
Write-Host "`n[2/4] Verifying node_modules dependencies..." -ForegroundColor White
if (-not (Test-Path "$WorkspaceRoot\backend\node_modules")) {
    Write-Host "    Installing backend dependencies..." -ForegroundColor Yellow
    npm --prefix "$WorkspaceRoot\backend" install
}
if (-not (Test-Path "$WorkspaceRoot\frontend\node_modules")) {
    Write-Host "    Installing frontend dependencies..." -ForegroundColor Yellow
    npm --prefix "$WorkspaceRoot\frontend" install
}
if (-not (Test-Path "$WorkspaceRoot\node_modules\concurrently")) {
    Write-Host "    Installing root orchestrator..." -ForegroundColor Yellow
    npm install --save-dev concurrently
}

# 3. Check Local Ollama
Write-Host "`n[3/4] Probing Local Ollama Runtime (http://127.0.0.1:11434)..." -ForegroundColor White
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction Stop
    Write-Host "    [OK] Local Ollama is ONLINE with models: $($ollamaCheck.models.name -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "    [INFO] Ollama is offline. Offline Fallback Engine will be used for follow-ups." -ForegroundColor Yellow
    Write-Host "    To activate live Llama 3 generation, run: ollama run llama3" -ForegroundColor DarkGray
}

# 4. Launch Backend & Frontend Concurrently
Write-Host "`n[4/4] Starting Full-Stack Application..." -ForegroundColor White
Write-Host "    Backend:  http://localhost:5000/api/applications" -ForegroundColor Cyan
Write-Host "    Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C at any time to stop both servers.`n" -ForegroundColor DarkGray

Start-Process "http://localhost:5173"
npx concurrently -k -p "[{name}]" -n "BACKEND,FRONTEND" -c "blue.bold,cyan.bold" `
    "npm --prefix `"$WorkspaceRoot\backend`" run dev" `
    "npm --prefix `"$WorkspaceRoot\frontend`" run dev"
