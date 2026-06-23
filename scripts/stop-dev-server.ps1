$connections = netstat -ano | Select-String ":3000\s+.*LISTENING"
$pids = @()

foreach ($line in $connections) {
  $parts = ($line -replace '\s+', ' ').ToString().Trim().Split(' ')
  $processId = $parts[-1]
  if ($processId -match '^\d+$') {
    $pids += [int]$processId
  }
}

foreach ($processId in ($pids | Select-Object -Unique)) {
  Write-Host "Stopping process $processId on port 3000..."
  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

if ($pids.Count -eq 0) {
  Write-Host "Port 3000 is free."
}
