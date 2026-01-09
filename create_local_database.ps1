# PowerShell script to create tommy_game_db database on local PostgreSQL
# This is needed when you have a local PostgreSQL instance running on port 5432

Write-Host "Creating database 'tommy_game_db' on local PostgreSQL..." -ForegroundColor Cyan

# Try to connect and create database
$env:PGPASSWORD = "postgres"
psql -h localhost -p 5432 -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'tommy_game_db'" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Note: You may need to enter PostgreSQL password when prompted" -ForegroundColor Yellow
    Write-Host "Creating database..." -ForegroundColor Cyan
    psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE tommy_game_db;"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database 'tommy_game_db' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create database. Please check your PostgreSQL connection." -ForegroundColor Red
        Write-Host "You can also create it manually using:" -ForegroundColor Yellow
        Write-Host "  psql -h localhost -p 5432 -U postgres -c 'CREATE DATABASE tommy_game_db;'" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Database 'tommy_game_db' already exists" -ForegroundColor Green
}

