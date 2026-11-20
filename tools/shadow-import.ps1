# Shadow-game pictures: assets\shadow\<id>.png (1024px, transparent) -> cards\shadow\<id>.png (256px)
# Then writes the list of ids that have pictures into js\shadowItems.js (SHADOW_IMAGES).
# Usage: powershell -File tools\shadow-import.ps1
Add-Type -AssemblyName System.Drawing
$q = Split-Path -Parent $PSScriptRoot
$src = Join-Path $q 'assets\shadow'
$dst = Join-Path $q 'cards\shadow'
New-Item -ItemType Directory -Force $dst | Out-Null
$items = Get-Content (Join-Path $q 'js\shadowItems.js') -Raw -Encoding UTF8
$known = [regex]::Matches($items, "\['([a-z]+)', '") | ForEach-Object { $_.Groups[1].Value }
$done = @(); $skipped = @()
foreach ($f in Get-ChildItem "$src\*.png") {
  $id = $f.BaseName.ToLower()
  if ($known -notcontains $id) { $skipped += $f.Name; continue }
  $img = [System.Drawing.Image]::FromFile($f.FullName)
  $S = 256
  $bmp = New-Object System.Drawing.Bitmap($S, $S, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
  $k = [Math]::Min($S / $img.Width, $S / $img.Height); $w = $img.Width * $k; $h = $img.Height * $k
  $g.DrawImage($img, [float](($S - $w) / 2), [float](($S - $h) / 2), [float]$w, [float]$h)
  $g.Dispose(); $img.Dispose()
  $bmp.Save((Join-Path $dst "$id.png"), [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
  $done += $id
}
$all = Get-ChildItem "$dst\*.png" | ForEach-Object { "'" + $_.BaseName + "'" }
$line = 'export const SHADOW_IMAGES = new Set([' + ($all -join ', ') + ']);'
$items = [regex]::Replace($items, 'export const SHADOW_IMAGES = new Set\(\[[^\]]*\]\);', $line)
[System.IO.File]::WriteAllText((Join-Path $q 'js\shadowItems.js'), $items, (New-Object System.Text.UTF8Encoding($false)))
"converted $($done.Count), total with pictures $($all.Count) / $($known.Count)"
if ($skipped.Count) { "unknown names (not used): $($skipped -join ', ')" }
