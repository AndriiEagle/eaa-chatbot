# PowerShell script for full stack startup (backend + frontend)
# Works around PowerShell limitation with && operator

Write-Host "Starting full stack: backend + frontend..." -ForegroundColor Green

# Stop all previous processes on ports 3000 and 5173/5174
Write-Host "Cleaning up previous processes..." -ForegroundColor Yellow
try {
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
    netstat -ano | findstr :3000 | foreach {$_.split()[-1]} | foreach {taskkill /f /pid $_ 2>$null}
    netstat -ano | findstr :5173 | foreach {$_.split()[-1]} | foreach {taskkill /f /pid $_ 2>$null}
    netstat -ano | findstr :5174 | foreach {$_.split()[-1]} | foreach {taskkill /f /pid $_ 2>$null}
} catch {
    Write-Host "Processes already stopped" -ForegroundColor Gray
}

# Compile and prepare backend
Write-Host "Compiling TypeScript and preparing backend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

npm run fix-hooks
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Hook fix failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

# Start backend in background
Write-Host "Starting backend on port 3000..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run start" -NoNewWindow -PassThru | Out-Null

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start frontend in background
Write-Host "Starting frontend..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory "src\client" -NoNewWindow -PassThru | Out-Null

# Wait for frontend to start
Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check services status
Write-Host "Checking services status..." -ForegroundColor Cyan
$backendRunning = $false
$frontendRunning = $false

# Try to check backend multiple times
for ($i = 1; $i -le 3; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendRunning = $true
            Write-Host "SUCCESS: Backend running on http://localhost:3000" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "Backend check attempt $i/3 failed, retrying..." -ForegroundColor Yellow
        if ($i -lt 3) {
            Start-Sleep -Seconds 2
        }
    }
}

if (!$backendRunning) {
    Write-Host "ERROR: Backend not responding on http://localhost:3000 after 3 attempts" -ForegroundColor Red
}

# Check frontend on different ports
$frontendPorts = @(5173, 5174, 5175)
foreach ($port in $frontendPorts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port" -Method GET -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $frontendRunning = $true
            Write-Host "SUCCESS: Frontend running on http://localhost:$port" -ForegroundColor Green
            break
        }
    } catch {
        # Try next port
    }
}

if (!$frontendRunning) {
    Write-Host "ERROR: Frontend not found on ports 5173-5175" -ForegroundColor Red
}

# Final status
Write-Host "" 
Write-Host "STARTUP STATUS:" -ForegroundColor Magenta
if ($backendRunning) {
    Write-Host "   Backend: RUNNING" -ForegroundColor Green
} else {
    Write-Host "   Backend: NOT RUNNING" -ForegroundColor Red
}

if ($frontendRunning) {
    Write-Host "   Frontend: RUNNING" -ForegroundColor Green
} else {
    Write-Host "   Frontend: NOT RUNNING" -ForegroundColor Red
}

if ($backendRunning -and $frontendRunning) {
    Write-Host ""
    Write-Host "FULL STACK SUCCESSFULLY STARTED!" -ForegroundColor Green
    Write-Host "   API: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   UI: http://localhost:5173 (or 5174/5175)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop or close terminal" -ForegroundColor Yellow
    
    # Keep script active
    Write-Host ""
    Write-Host "Monitoring services... (Ctrl+C to stop)" -ForegroundColor Gray
    try {
        while ($true) {
            Start-Sleep -Seconds 5
        }
    } catch {
        Write-Host ""
        Write-Host "Stopping services..." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "FAILED TO START FULL STACK" -ForegroundColor Red
    exit 1
} 