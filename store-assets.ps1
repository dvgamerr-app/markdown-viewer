Add-Type -AssemblyName System.Drawing
$root = $PSScriptRoot
$out = Join-Path $root 'store-assets'
New-Item -ItemType Directory -Force -Path $out | Out-Null
function Color($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Text($g,$text,$size,$x,$y,$color='#eef3dc',$bold=$false) {
  $style = [System.Drawing.FontStyle]::Regular
  if ($bold) { $style = [System.Drawing.FontStyle]::Bold }
  $font = [System.Drawing.Font]::new('Segoe UI',$size,$style,[System.Drawing.GraphicsUnit]::Pixel)
  $brush = [System.Drawing.SolidBrush]::new((Color $color))
  $g.DrawString($text,$font,$brush,[float]$x,[float]$y)
  $font.Dispose(); $brush.Dispose()
}
function Picture($g,$path,$x,$y,$w,$h) {
  $im = [System.Drawing.Image]::FromFile((Join-Path $root $path))
  $g.DrawImage($im,[int]$x,[int]$y,[int]$w,[int]$h); $im.Dispose()
}
function Canvas($w,$h,$name,$draw) {
  $bitmap = [System.Drawing.Bitmap]::new($w,$h,[System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = 'AntiAlias'; $g.InterpolationMode = 'HighQualityBicubic'
  $g.TextRenderingHint = 'AntiAliasGridFit'; $g.Clear((Color '#17251e'))
  & $draw $g
  $bitmap.Save((Join-Path $out $name),[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bitmap.Dispose()
}
Canvas 128 128 'store-icon-128.png' { param($g)
  Picture $g 'icons/default/128x128.png' 0 0 128 128
}
Canvas 1280 800 'screenshot-01-settings.png' { param($g)
  Text $g 'Make Markdown feel like home.' 38 55 22 '#eef3dc' $true
  Text $g 'Themes, reading width, and rendering options in one place.' 19 57 77 '#b9cdb6'
  Picture $g 'docs/screenshots/settings-preview.png' 160 117 960 675
}
Canvas 1280 800 'screenshot-02-dark-mode.png' { param($g)
  Text $g 'A calmer space. Day or night.' 38 55 22 '#eef3dc' $true
  Text $g 'Switch the settings interface to dark mode.' 19 57 77 '#b9cdb6'
  Picture $g 'docs/screenshots/settings-dark-preview.png' 160 117 960 675
}
Canvas 1280 800 'screenshot-03-quick-controls.png' { param($g)
  Picture $g 'icons/default/128x128.png' 65 90 80 80
  Text $g 'Nimbus Markdown' 36 62 195 '#eef3dc' $true
  Text $g "Your preview.`nYour preferences." 34 62 267 '#eef3dc' $true
  Text $g "Quick access to themes`nand content options." 22 65 388 '#b9cdb6'
  Picture $g 'docs/screenshots/popup-preview.png' 445 100 342 540
  Picture $g 'docs/screenshots/popup-content-preview.png' 836 160 342 540
}
Canvas 440 280 'small-promo-440x280.png' { param($g)
  Picture $g 'icons/default/128x128.png' 28 26 64 64
  Text $g 'Nimbus Markdown' 28 26 108 '#eef3dc' $true
  Text $g "Markdown,`nbeautifully readable." 25 27 151 '#eef3dc'
  Text $g 'Themes / Diagrams / Math / Code' 16 28 240 '#b9cdb6'
}
Canvas 1400 560 'marquee-promo-1400x560.png' { param($g)
  Picture $g 'icons/default/128x128.png' 65 58 82 82
  Text $g 'NIMBUS MARKDOWN' 21 169 84 '#b9cdb6' $true
  Text $g "Markdown,`nbeautifully readable." 54 60 173 '#eef3dc' $true
  Text $g 'Local files. Your favorite sites. Your own style.' 23 65 343 '#b9cdb6'
  Text $g 'Themes / Mermaid / MathJax / Syntax highlighting' 20 65 443 '#b9cdb6'
  Picture $g 'docs/screenshots/settings-dark-preview.png' 726 76 640 450
}
Get-ChildItem $out -Filter '*.png' | ForEach-Object {
  $im = [System.Drawing.Image]::FromFile($_.FullName)
  Write-Output "$($_.Name): $($im.Width)x$($im.Height), $($im.PixelFormat)"
  $im.Dispose()
}
