Add-Type -AssemblyName System.Drawing

$Dir       = $PSScriptRoot
$IconPath  = Join-Path $Dir 'snark-weather.ico'
$BatPath   = Join-Path $Dir 'launch-snark-weather.bat'
$LinkName  = 'Snark Weather.lnk'
$LinkPath  = Join-Path ([Environment]::GetFolderPath('Desktop')) $LinkName

$size = 256
$bmp  = New-Object System.Drawing.Bitmap $size, $size
$g    = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'

$bgRect = New-Object System.Drawing.Rectangle 4, 4, ($size - 8), ($size - 8)
$path   = New-Object System.Drawing.Drawing2D.GraphicsPath
$r = 28
$path.AddArc($bgRect.X,            $bgRect.Y,             $r*2, $r*2, 180, 90)
$path.AddArc($bgRect.Right - $r*2, $bgRect.Y,             $r*2, $r*2, 270, 90)
$path.AddArc($bgRect.Right - $r*2, $bgRect.Bottom - $r*2, $r*2, $r*2, 0,   90)
$path.AddArc($bgRect.X,            $bgRect.Bottom - $r*2, $r*2, $r*2, 90,  90)
$path.CloseFigure()
$g.FillPath((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 36, 56))), $path)
$g.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 176, 46)), 6), $path)

# Storm cloud
$cloud = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 226, 230, 240))
$g.FillEllipse($cloud, 52, 96, 90, 80)
$g.FillEllipse($cloud, 100, 66, 100, 100)
$g.FillEllipse($cloud, 142, 104, 66, 66)
$g.FillRectangle($cloud, 90, 120, 90, 56)

# Lightning bolt
$bolt = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 176, 46))
$pts = @(
  (New-Object System.Drawing.Point 138, 150),
  (New-Object System.Drawing.Point 102, 202),
  (New-Object System.Drawing.Point 128, 202),
  (New-Object System.Drawing.Point 112, 244),
  (New-Object System.Drawing.Point 168, 188),
  (New-Object System.Drawing.Point 140, 188),
  (New-Object System.Drawing.Point 162, 150)
)
$g.FillPolygon($bolt, [System.Drawing.Point[]]$pts)
$g.Dispose()

$ms  = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$png = $ms.ToArray(); $ms.Close(); $bmp.Dispose()

if (Test-Path $IconPath) { Remove-Item $IconPath -Force }
$fs = New-Object System.IO.FileStream $IconPath, 'Create'
$bw = New-Object System.IO.BinaryWriter $fs
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]1)
$bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([byte]0)
$bw.Write([uint16]1); $bw.Write([uint16]32)
$bw.Write([uint32]$png.Length); $bw.Write([uint32]22)
$bw.Write($png); $bw.Close(); $fs.Close()

$ws  = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($LinkPath)
$lnk.TargetPath       = $BatPath
$lnk.WorkingDirectory = $Dir
$lnk.IconLocation     = "$IconPath,0"
$lnk.Description      = 'Snark Weather - sarcastic weather briefings'
$lnk.WindowStyle      = 7
$lnk.Save()

Write-Host "[ok] Shortcut placed on Desktop: $LinkName"
