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
Canvas 1280 800 'screenshot-01-flowchart.png' { param($g)
  Text $g 'Mermaid diagrams you can explore.' 38 55 22 '#eef3dc' $true
  Text $g 'Open any diagram fullscreen: zoom, find a node, see what flows in and out.' 19 57 77 '#b9cdb6'
  Picture $g 'docs/screenshots/01-flowchart-fullscreen.png' 120 140 1040 650
}
Canvas 1280 800 'screenshot-02-sequence.png' { param($g)
  Text $g 'Sequence diagrams, day or night.' 38 55 22 '#eef3dc' $true
  Text $g 'Diagrams follow the theme you read in, light or dark.' 19 57 77 '#b9cdb6'
  Picture $g 'docs/screenshots/02-sequence-dark.png' 120 140 1040 650
}
Canvas 1280 800 'screenshot-03-journey.png' { param($g)
  Text $g 'Journeys and timelines that play.' 38 55 22 '#eef3dc' $true
  Text $g 'Step through a user journey or a release history, one stage at a time.' 19 57 77 '#b9cdb6'
  Picture $g 'docs/screenshots/03-journey.png' 120 140 1040 650
}
Canvas 1280 800 'screenshot-04-dbml.png' { param($g)
  Text $g 'Database schemas from DBML.' 38 55 22 '#eef3dc' $true
  Text $g 'Tables, keys and relations drawn straight from a dbml code block.' 19 57 77 '#b9cdb6'
  Picture $g 'docs/screenshots/04-dbml-dark.png' 120 140 1040 650
}
Canvas 1280 800 'screenshot-05-document.png' { param($g)
  Text $g 'Markdown, beautifully rendered.' 38 55 22 '#eef3dc' $true
  Text $g 'Tables, code, math and a table of contents for every document.' 19 57 77 '#b9cdb6'
  Picture $g 'docs/screenshots/05-table-code.png' 120 140 1040 650
}
Canvas 440 280 'small-promo-440x280.png' { param($g)
  Picture $g 'icons/default/128x128.png' 28 26 64 64
  Text $g 'Nimbus Markdown' 28 26 108 '#eef3dc' $true
  Text $g "Markdown,`nbeautifully rendered." 25 27 151 '#eef3dc'
  Text $g 'Mermaid / DBML / Math / Code' 16 28 240 '#b9cdb6'
}
Canvas 1400 560 'marquee-promo-1400x560.png' { param($g)
  Picture $g 'icons/default/128x128.png' 65 58 82 82
  Text $g 'NIMBUS MARKDOWN' 21 169 84 '#b9cdb6' $true
  Text $g "Markdown,`nbeautifully rendered." 54 60 173 '#eef3dc' $true
  Text $g 'Mermaid diagrams you can explore in fullscreen.' 23 65 343 '#b9cdb6'
  Text $g 'Flowcharts / Sequences / Journeys / DBML' 20 65 443 '#b9cdb6'
  Picture $g 'docs/screenshots/01-flowchart-fullscreen.png' 726 80 640 400
}
Get-ChildItem $out -Filter '*.png' | ForEach-Object {
  $im = [System.Drawing.Image]::FromFile($_.FullName)
  Write-Output "$($_.Name): $($im.Width)x$($im.Height), $($im.PixelFormat)"
  $im.Dispose()
}
