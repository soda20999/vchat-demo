$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$nextBin = Join-Path $root 'node_modules/next/dist/bin/next'
$serverOutLog = Join-Path $root '.playwright/next-dev.out.log'
$serverErrLog = Join-Path $root '.playwright/next-dev.err.log'
$env:PLAYWRIGHT_SKIP_WEB_SERVER = '1'
$exitCode = 1
$server = $null

function Test-NextServer {
  try {
    $response = Invoke-WebRequest -Uri 'http://127.0.0.1:3000/auth' -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  } catch {
    return $false
  }
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $serverOutLog) | Out-Null
Remove-Item -LiteralPath $serverOutLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $serverErrLog -Force -ErrorAction SilentlyContinue

if (-not (Test-NextServer)) {
  $server = Start-Process -FilePath 'node' -ArgumentList @($nextBin, 'dev', '--hostname', '127.0.0.1') -WorkingDirectory $root -RedirectStandardOutput $serverOutLog -RedirectStandardError $serverErrLog -PassThru -WindowStyle Hidden
}

try {
  $deadline = (Get-Date).AddSeconds(60)
  do {
    if (Test-NextServer) { break }
    if ($server -and $server.HasExited) { break }

    if ((Get-Date) -lt $deadline) {
      Start-Sleep -Milliseconds 500
    }
  } while ((Get-Date) -lt $deadline)

  if (-not (Test-NextServer)) {
    if (Test-Path -LiteralPath $serverOutLog) {
      Get-Content -LiteralPath $serverOutLog
    }
    if (Test-Path -LiteralPath $serverErrLog) {
      Get-Content -LiteralPath $serverErrLog
    }
    throw 'Timed out waiting for Next dev server at http://127.0.0.1:3000'
  }

  & npx.cmd playwright test @args
  $exitCode = $LASTEXITCODE
} finally {
  if ($server -and -not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}

exit $exitCode
