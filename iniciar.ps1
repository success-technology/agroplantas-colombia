# AgroPlantas Colombia — inicio con Python 3.10
Write-Host "=== AgroPlantas Colombia ===" -ForegroundColor Green

$pythonCmd = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
    $v310 = py -3.10 -c "import sys; print(sys.executable)" 2>$null
    if ($v310) { $pythonCmd = "py -3.10" }
}
if (-not $pythonCmd) {
    Write-Host "ERROR: Instala Python 3.10 desde python.org" -ForegroundColor Red
    Write-Host "TensorFlow no funciona con Python 3.14." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path ".venv310")) {
    Write-Host "Creando entorno virtual (Python 3.10)..."
    Invoke-Expression "$pythonCmd -m venv .venv310"
}

$venvPython = ".\.venv310\Scripts\python.exe"
& $venvPython -m pip install -r requirements.txt -q

Write-Host "Backend: http://localhost:8000"
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$PWD'; .\.venv310\Scripts\Activate.ps1; cd backend; uvicorn main:app --reload --host 0.0.0.0 --port 8000"
)

if (-not (Test-Path "frontend\node_modules")) {
    Push-Location frontend
    npm install
    Pop-Location
}

Write-Host "Frontend: http://localhost:3000"
Push-Location frontend
npm run dev
