param(
  [string]$WorkspacePath = "C:\Users\Gamer\Desktop\VortexPCs.com\Website Files",
  [string]$BackupRoot = "$WorkspacePath\backups",
  [int]$Retention = 2,
  [string]$LogFile = "$WorkspacePath\backups\backup.log"
)

# Ensure backup directory exists
if (!(Test-Path $BackupRoot)) {
  New-Item -ItemType Directory -Path $BackupRoot | Out-Null
}

# Prepare timestamp and destination
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dest = "$BackupRoot\site-backup-$timestamp.zip"

# Write start log
$startMsg = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] Starting backup to: $dest"
Add-Content -Path $LogFile -Value $startMsg

try {
  # Gather items excluding backups folder
  $items = Get-ChildItem -Path $WorkspacePath -Force | Where-Object { $_.Name -ne 'backups' }
  $paths = $items | Select-Object -ExpandProperty FullName

  # Create archive
  Compress-Archive -Path $paths -DestinationPath $dest -Force

  $sizeMB = (Get-Item $dest).Length / 1MB
  $sizeMsg = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] Backup created (size: " + ([string]::Format('{0:N2}', $sizeMB)) + " MB)"
  Add-Content -Path $LogFile -Value $sizeMsg

  # Retention: keep only the most recent $Retention backups
  $existing = Get-ChildItem -Path $BackupRoot -File -Filter *.zip | Sort-Object LastWriteTime -Descending
  $toKeep = $existing | Select-Object -First $Retention
  $toDelete = $existing | Select-Object -Skip $Retention

  $deletedCount = 0
  foreach ($f in $toDelete) {
    try {
      Remove-Item -Force $f.FullName
      $deletedCount++
      Add-Content -Path $LogFile -Value ("[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] Deleted old backup: " + $f.FullName)
    } catch {
      Add-Content -Path $LogFile -Value ("[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] Failed to delete old backup: " + $f.FullName + " - " + $_.Exception.Message)
    }
  }

  $summary = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] Retention complete. Kept: " + ($toKeep.Count) + ", Deleted: " + $deletedCount
  Add-Content -Path $LogFile -Value $summary

} catch {
  $errMsg = "[" + (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + "] Backup failed: " + $_.Exception.Message
  Add-Content -Path $LogFile -Value $errMsg
  throw
}

# Output status to console
Write-Output "Backup: $dest"
Write-Output "Log: $LogFile"
Get-ChildItem -Path $BackupRoot -File -Filter *.zip | Sort-Object LastWriteTime -Descending | Select-Object FullName, LastWriteTime, Length | Format-Table | Out-String