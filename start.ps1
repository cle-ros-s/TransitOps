# TransitOps — Start All Services
# Run this script to start both backend and frontend

param(
  [string]$PostgresPassword = ""
)

Write-Host "`n🚀 TransitOps Startup Script" -ForegroundColor Cyan
Write-Host ("─" * 50) -ForegroundColor DarkGray

# ── Step 1: Setup database if needed ────────────────────────────────────────
$backendDir = "d:\TransitOps-backend"
$frontendDir = "d:\TransitOps\frontend"

if (-not (Test-Path "$backendDir\prisma\migrations")) {
  Write-Host "`n📦 First run detected — running database setup..." -ForegroundColor Yellow
  if ($PostgresPassword -eq "") {
    $secPw = Read-Host -Prompt "Enter PostgreSQL password for 'postgres' user" -AsSecureString
    $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
      [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPw)
    )
  }
  node "$backendDir\setup.js" $PostgresPassword
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database setup failed. Please run: node $backendDir\setup.js" -ForegroundColor Red
    exit 1
  }
}

# ── Step 2: Start Backend ────────────────────────────────────────────────────
Write-Host "`n▶️  Starting Backend (port 4000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# ── Step 3: Start Frontend ───────────────────────────────────────────────────
Write-Host "▶️  Starting Frontend (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`n✅ Both servers started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend:    http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔌 Backend API: http://localhost:4000" -ForegroundColor Cyan
Write-Host "📖 Swagger:     http://localhost:4000/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Login credentials:" -ForegroundColor Yellow
Write-Host "   fleet@transitops.com    / fleet123     → Fleet Manager"
Write-Host "   dispatch@transitops.com / dispatch123  → Dispatcher"
Write-Host "   safety@transitops.com   / safety123    → Safety Officer"
Write-Host "   finance@transitops.com  / finance123   → Financial Analyst"
Write-Host ""
