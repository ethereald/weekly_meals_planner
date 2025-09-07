#!/bin/bash

# This script generates PNG icons from SVG files
# You can run this script after installing imagemagick: brew install imagemagick (macOS) or apt-get install imagemagick (Ubuntu)

# Create all required sizes from the main SVG icon
convert public/icons/icon.svg -resize 72x72 public/icons/icon-72x72.png
convert public/icons/icon.svg -resize 96x96 public/icons/icon-96x96.png
convert public/icons/icon.svg -resize 128x128 public/icons/icon-128x128.png
convert public/icons/icon.svg -resize 144x144 public/icons/icon-144x144.png
convert public/icons/icon.svg -resize 152x152 public/icons/icon-152x152.png
convert public/icons/icon.svg -resize 192x192 public/icons/icon-192x192.png
convert public/icons/icon.svg -resize 384x384 public/icons/icon-384x384.png
convert public/icons/icon.svg -resize 512x512 public/icons/icon-512x512.png

# Create Apple Touch Icons
convert public/icons/icon.svg -resize 180x180 public/icons/apple-touch-icon.png
convert public/icons/icon.svg -resize 167x167 public/icons/apple-touch-icon-167x167.png
convert public/icons/icon.svg -resize 152x152 public/icons/apple-touch-icon-152x152.png
convert public/icons/icon.svg -resize 120x120 public/icons/apple-touch-icon-120x120.png

# Create favicon
convert public/icons/icon.svg -resize 32x32 public/favicon-32x32.png
convert public/icons/icon.svg -resize 16x16 public/favicon-16x16.png

echo "Icons generated successfully!"
echo "Note: This requires ImageMagick to be installed."
echo "For online conversion, use: https://cloudconvert.com/svg-to-png"
