Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\inyak\Desktop\deteiling\public\icons\sokol-logo.png"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        # Check if non-black (red or white logo marks)
        if ($pixel.R -gt 35 -or $pixel.G -gt 35 -or $pixel.B -gt 35) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Detected bounds: X: $minX..$maxX, Y: $minY..$maxY"

$contentW = $maxX - $minX
$contentH = $maxY - $minY
$centerCenterX = ($minX + $maxX) / 2
$centerCenterY = ($minY + $maxY) / 2

# Square size with ~12% breathing padding around the logo text
$side = [Math]::Max($contentW, $contentH) * 1.25

$cropX = [Math]::Max(0, [int]($centerCenterX - $side / 2))
$cropY = [Math]::Max(0, [int]($centerCenterY - $side / 2))
$cropW = [Math]::Min($bmp.Width - $cropX, [int]$side)
$cropH = [Math]::Min($bmp.Height - $cropY, [int]$side)

Write-Host "Crop rect: $cropX, $cropY, $cropW, $cropH"

$destBmp = [System.Drawing.Bitmap]::new(512, 512)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Fill background with sleek dark studio black #0a0a0c
$bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 10, 10, 12))
$g.FillRectangle($bgBrush, 0, 0, 512, 512)

# Draw cropped area scaled up
$srcRect = [System.Drawing.Rectangle]::new($cropX, $cropY, $cropW, $cropH)
$destRect = [System.Drawing.Rectangle]::new(0, 0, 512, 512)
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$g.Dispose()
$bmp.Dispose()

# Save to all required icon destinations
$destBmp.Save("C:\Users\inyak\Desktop\deteiling\public\icons\sokol-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Save("C:\Users\inyak\Desktop\deteiling\public\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Save("C:\Users\inyak\Desktop\deteiling\public\pwa-512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Save("C:\Users\inyak\Desktop\deteiling\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Resize to 192x192
$bmp192 = [System.Drawing.Bitmap]::new(192, 192)
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.DrawImage($destBmp, 0, 0, 192, 192)
$g192.Dispose()
$bmp192.Save("C:\Users\inyak\Desktop\deteiling\public\pwa-192x192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp192.Dispose()

$destBmp.Dispose()
Write-Host "Successfully generated zoomed, high-res PWA icons!"
