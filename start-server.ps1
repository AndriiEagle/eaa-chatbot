# PowerShell скрипт для компиляции и запуска сервера в Windows
# (так как оператор && не работает в PowerShell как в bash)

Write-Host "Компиляция TypeScript, подготовка хуков и запуск сервера..." -ForegroundColor Green

# Запускаем наш новый npm скрипт, который делает все необходимое
npm run build-and-run

# Проверяем код возврата
if ($LASTEXITCODE -ne 0) {
    Write-Host "Ошибка при выполнении build-and-run, код завершения: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
} 