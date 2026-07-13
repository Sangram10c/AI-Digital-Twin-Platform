# Install pgvector extension for PostgreSQL on Windows (unofficial prebuilt binaries)
# Source: https://github.com/andreiramani/pgvector_pgsql_windows
# Run as Administrator: Right-click PowerShell -> Run as administrator

$ErrorActionPreference = 'Stop'

$pgRoot = 'C:\Program Files\PostgreSQL\16'
$pgVersion = '16'
$releaseTag = '0.8.3_16.14'
$zipName = 'vector.v0.8.3-pg16.zip'
$downloadUrl = "https://github.com/andreiramani/pgvector_pgsql_windows/releases/download/$releaseTag/$zipName"

if (-not (Test-Path $pgRoot)) {
  Write-Error "PostgreSQL not found at $pgRoot. Update `$pgRoot in this script."
}

Write-Host "Downloading pgvector for PostgreSQL $pgVersion..."
$tempDir = Join-Path $env:TEMP "pgvector-install"
$zipPath = Join-Path $tempDir $zipName
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing

Write-Host "Extracting..."
$extractDir = Join-Path $tempDir 'extracted'
if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

# Copy lib/*.dll and share/extension/* into PostgreSQL install
$libSrc = Get-ChildItem -Path $extractDir -Recurse -Filter '*.dll' | Select-Object -First 1
$extFiles = Get-ChildItem -Path $extractDir -Recurse -Include 'vector.control','vector--*.sql' -File

if (-not $libSrc) { Write-Error 'vector.dll not found in archive' }
if (-not $extFiles) { Write-Error 'vector extension SQL files not found in archive' }

$libDest = Join-Path $pgRoot 'lib'
$extDest = Join-Path $pgRoot 'share\extension'

Write-Host "Installing DLL to $libDest..."
Copy-Item -Path $libSrc.FullName -Destination $libDest -Force

Write-Host "Installing extension files to $extDest..."
foreach ($file in $extFiles) {
  Copy-Item -Path $file.FullName -Destination $extDest -Force
  Write-Host "  -> $($file.Name)"
}

Write-Host "Restarting PostgreSQL service..."
$service = Get-Service -Name 'postgresql-x64-16' -ErrorAction SilentlyContinue
if ($service) {
  Restart-Service -Name 'postgresql-x64-16' -Force
  Write-Host "Service restarted."
} else {
  Write-Warning "Could not find service 'postgresql-x64-16'. Restart PostgreSQL manually."
}

Write-Host ""
Write-Host "Done. Verify with:"
Write-Host "  psql -U postgres -d ai_digital_twin -c `"CREATE EXTENSION IF NOT EXISTS vector;`""
