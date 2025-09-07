# PWA Icons Setup

This directory contains the icons needed for the Progressive Web App (PWA) functionality.

## Required Icons

To complete the PWA setup, you need to generate the following PNG icons from the SVG file:

### App Icons
- `icon-72x72.png` - 72×72 pixels
- `icon-96x96.png` - 96×96 pixels  
- `icon-128x128.png` - 128×128 pixels
- `icon-144x144.png` - 144×144 pixels
- `icon-152x152.png` - 152×152 pixels
- `icon-192x192.png` - 192×192 pixels
- `icon-384x384.png` - 384×384 pixels
- `icon-512x512.png` - 512×512 pixels

### Apple Touch Icons
- `apple-touch-icon.png` - 180×180 pixels
- `apple-touch-icon-152x152.png` - 152×152 pixels
- `apple-touch-icon-120x120.png` - 120×120 pixels

### Favicons
- `favicon-32x32.png` - 32×32 pixels (also copy to `/public/`)
- `favicon-16x16.png` - 16×16 pixels (also copy to `/public/`)

## How to Generate Icons

### Option 1: Online Tool (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload the `icon.svg` file
3. Download the generated package
4. Extract and place the files in this directory

### Option 2: Manual Conversion
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Convert to each required size
4. Download and rename according to the list above

### Option 3: Command Line (if you have ImageMagick)
Run the `generate-icons.sh` script from the project root:
```bash
chmod +x generate-icons.sh
./generate-icons.sh
```

## Files in this directory

- `icon.svg` - Main app icon (source file)
- `icon-maskable.svg` - Maskable icon for adaptive icons
- `README.md` - This file

## After generating icons

1. Place all PNG files in this directory
2. Copy `favicon-32x32.png` and `favicon-16x16.png` to `/public/`
3. Test the PWA by opening the app in Chrome/Safari and checking for the install prompt
4. Verify icons appear correctly when installed to home screen

## Testing

After setting up icons:
1. Open the app in a mobile browser
2. Look for "Add to Home Screen" option
3. Install the app and verify the icon appears correctly
4. Open from home screen and verify it opens in standalone mode (no browser UI)
