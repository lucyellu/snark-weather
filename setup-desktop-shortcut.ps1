# Creates the "Snark Weather" desktop shortcut using snark-weather.ico.
$Dir       = $PSScriptRoot
$IconPath  = Join-Path $Dir 'snark-weather.ico'
$BatPath   = Join-Path $Dir 'launch-snark-weather.bat'
$LinkPath  = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Snark Weather.lnk'

$ws  = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($LinkPath)
$lnk.TargetPath       = $BatPath
$lnk.WorkingDirectory = $Dir
$lnk.IconLocation     = "$IconPath,0"
$lnk.Description      = 'Snark Weather - opens in Chrome'
$lnk.WindowStyle      = 7
$lnk.Save()

Write-Host "[ok] Shortcut placed on Desktop: Snark Weather.lnk"
