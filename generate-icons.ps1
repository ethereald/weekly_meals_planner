# PowerShell script to help generate icons
# This script provides instructions for generating PNG icons from SVG

Write-Host "=== PWA Icon Generator Instructions ===" -ForegroundColor Green
Write-Host ""
Write-Host "To generate PNG icons from the SVG files, you have several options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Online Conversion (Recommended)" -ForegroundColor Cyan
Write-Host "1. Go to https://cloudconvert.com/svg-to-png"
Write-Host "2. Upload public/icons/icon.svg"
Write-Host "3. Set the following sizes and download:"
Write-Host "   - 72x72   -> save as icon-72x72.png"
Write-Host "   - 96x96   -> save as icon-96x96.png"
Write-Host "   - 128x128 -> save as icon-128x128.png"
Write-Host "   - 144x144 -> save as icon-144x144.png"
Write-Host "   - 152x152 -> save as icon-152x152.png"
Write-Host "   - 192x192 -> save as icon-192x192.png"
Write-Host "   - 384x384 -> save as icon-384x384.png"
Write-Host "   - 512x512 -> save as icon-512x512.png"
Write-Host "   - 180x180 -> save as apple-touch-icon.png"
Write-Host "   - 32x32   -> save as favicon-32x32.png"
Write-Host "   - 16x16   -> save as favicon-16x16.png"
Write-Host ""
Write-Host "Option 2: Using ImageMagick (if installed)" -ForegroundColor Cyan
Write-Host "Install ImageMagick, then run the generate-icons.sh script"
Write-Host ""
Write-Host "Option 3: Use online tool https://realfavicongenerator.net/" -ForegroundColor Cyan
Write-Host "Upload the SVG and it will generate all required sizes"
Write-Host ""
Write-Host "All generated PNG files should be placed in public/icons/ directory" -ForegroundColor Green
