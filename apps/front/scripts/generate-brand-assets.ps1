$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$frontRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$resourceRoot = Join-Path $frontRoot 'android/app/src/main/res'
$source = [System.Drawing.Bitmap]::new((Join-Path $frontRoot 'src/assets/logo_ecogiro.png'))
$cream = [System.Drawing.ColorTranslator]::FromHtml('#FFFAF0')

# Trim the transparent canvas so the visible symbol fills small favicon sizes.
$left = $source.Width; $top = $source.Height; $right = 0; $bottom = 0
for ($y = 0; $y -lt $source.Height; $y++) {
  for ($x = 0; $x -lt $source.Width; $x++) {
    if ($source.GetPixel($x, $y).A -gt 32) {
      $left = [Math]::Min($left, $x); $right = [Math]::Max($right, $x)
      $top = [Math]::Min($top, $y); $bottom = [Math]::Max($bottom, $y)
    }
  }
}
if ($left -gt $right) { throw 'Logo has no visible pixels.' }
$crop = [System.Drawing.Rectangle]::new($left, $top, $right - $left + 1, $bottom - $top + 1)

function New-BrandImage([int]$Width, [int]$Height, [double]$Coverage, [System.Drawing.Color]$Background) {
  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear($Background)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $scale = [Math]::Min($Width, $Height) * $Coverage / [Math]::Max($crop.Width, $crop.Height)
    $w = [int]($crop.Width * $scale); $h = [int]($crop.Height * $scale)
    $destination = [System.Drawing.Rectangle]::new([int](($Width - $w) / 2), [int](($Height - $h) / 2), $w, $h)
    $graphics.DrawImage($source, $destination, $crop, [System.Drawing.GraphicsUnit]::Pixel)
  } finally { $graphics.Dispose() }
  return ,$bitmap
}

function Save-BrandImage([string]$Path, [int]$Width, [int]$Height, [double]$Coverage, [System.Drawing.Color]$Background) {
  [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($Path)) | Out-Null
  $bitmap = New-BrandImage $Width $Height $Coverage $Background
  try { $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png) } finally { $bitmap.Dispose() }
}

try {
  $sizes = @(16, 32, 48, 64, 128, 256)
  $frames = [System.Collections.Generic.List[byte[]]]::new()
  foreach ($size in $sizes) {
    $bitmap = New-BrandImage $size $size 0.94 ([System.Drawing.Color]::Transparent)
    $memory = [System.IO.MemoryStream]::new()
    try {
      $bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
      $frames.Add($memory.ToArray())
    } finally { $memory.Dispose(); $bitmap.Dispose() }
  }
  $writer = [System.IO.BinaryWriter]::new([System.IO.File]::Create((Join-Path $frontRoot 'public/fav.ico')))
  try {
    $writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$sizes.Count)
    $offset = 6 + 16 * $sizes.Count
    for ($i = 0; $i -lt $sizes.Count; $i++) {
      $dimension = if ($sizes[$i] -eq 256) { 0 } else { $sizes[$i] }
      $writer.Write([byte]$dimension); $writer.Write([byte]$dimension)
      $writer.Write([byte]0); $writer.Write([byte]0)
      $writer.Write([uint16]1); $writer.Write([uint16]32)
      $writer.Write([uint32]$frames[$i].Length); $writer.Write([uint32]$offset)
      $offset += $frames[$i].Length
    }
    foreach ($frame in $frames) { $writer.Write([byte[]]$frame) }
  } finally { $writer.Dispose() }
  Save-BrandImage (Join-Path $frontRoot 'public/icon-192.png') 192 192 0.88 $cream
  Save-BrandImage (Join-Path $frontRoot 'public/icon-512.png') 512 512 0.88 $cream
  Save-BrandImage (Join-Path $frontRoot 'public/apple-touch-icon.png') 180 180 0.80 $cream

  $densities = @{ mdpi = 1; hdpi = 1.5; xhdpi = 2; xxhdpi = 3; xxxhdpi = 4 }
  foreach ($density in $densities.Keys) {
    $scale = $densities[$density]
    foreach ($name in @('ic_launcher', 'ic_launcher_round')) {
      Save-BrandImage (Join-Path $resourceRoot "mipmap-$density/$name.png") ([int](48 * $scale)) ([int](48 * $scale)) 0.76 $cream
    }
    # Adaptive icons need room for the masks applied by Android launchers.
    Save-BrandImage (Join-Path $resourceRoot "mipmap-$density/ic_launcher_foreground.png") ([int](108 * $scale)) ([int](108 * $scale)) 0.60 ([System.Drawing.Color]::Transparent)
    Save-BrandImage (Join-Path $resourceRoot "drawable-port-$density/splash.png") ([int](480 * $scale)) ([int](800 * $scale)) 0.42 $cream
    Save-BrandImage (Join-Path $resourceRoot "drawable-land-$density/splash.png") ([int](800 * $scale)) ([int](480 * $scale)) 0.42 $cream
  }
  Save-BrandImage (Join-Path $resourceRoot 'drawable/splash.png') 480 800 0.42 $cream
  Save-BrandImage (Join-Path $resourceRoot 'drawable/splash_icon.png') 288 288 0.60 ([System.Drawing.Color]::Transparent)
  $encoding = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText((Join-Path $resourceRoot 'values/colors.xml'), @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#1E8E5A</color>
    <color name="colorPrimaryDark">#14653F</color>
    <color name="colorAccent">#1E8E5A</color>
    <color name="eco_cream">#FFFAF0</color>
</resources>
'@, $encoding)
  [System.IO.File]::WriteAllText((Join-Path $resourceRoot 'values/ic_launcher_background.xml'), @'
<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#FFFAF0</color></resources>
'@, $encoding)
  $stylesPath = Join-Path $resourceRoot 'values/styles.xml'
  $styles = [System.IO.File]::ReadAllText($stylesPath)
  $launchTheme = @'
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/splash</item>
        <item name="windowSplashScreenBackground">@color/eco_cream</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_icon</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
'@
  $styles = [regex]::Replace($styles, '(?s)<style name="AppTheme.NoActionBarLaunch" parent="[^"]+">.*?</style>', $launchTheme)
  [System.IO.File]::WriteAllText($stylesPath, $styles, $encoding)
  Write-Output "Generated web and Android assets from visible logo bounds: $crop"
} finally { $source.Dispose() }
