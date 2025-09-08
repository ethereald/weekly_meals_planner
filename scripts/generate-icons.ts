import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG content - meal planning themed icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" fill="#3B82F6" rx="64"/>
  
  <!-- Plate -->
  <circle cx="256" cy="256" r="140" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="4"/>
  
  <!-- Food items -->
  <!-- Main dish -->
  <ellipse cx="240" cy="230" rx="50" ry="30" fill="#EF4444"/>
  
  <!-- Side dish 1 -->
  <circle cx="300" cy="260" r="25" fill="#10B981"/>
  
  <!-- Side dish 2 -->
  <rect x="200" y="280" width="40" height="20" rx="10" fill="#F59E0B"/>
  
  <!-- Utensils -->
  <!-- Fork -->
  <g transform="translate(150, 200)">
    <rect x="0" y="0" width="4" height="60" fill="#6B7280"/>
    <rect x="-2" y="0" width="2" height="15" fill="#6B7280"/>
    <rect x="2" y="0" width="2" height="15" fill="#6B7280"/>
    <rect x="6" y="0" width="2" height="15" fill="#6B7280"/>
  </g>
  
  <!-- Knife -->
  <g transform="translate(350, 200)">
    <rect x="0" y="0" width="4" height="60" fill="#6B7280"/>
    <rect x="-1" y="0" width="6" height="20" fill="#9CA3AF"/>
  </g>
  
  <!-- Calendar element -->
  <g transform="translate(380, 150)">
    <rect x="0" y="0" width="40" height="30" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="2" rx="4"/>
    <rect x="0" y="0" width="40" height="10" fill="#3B82F6" rx="4"/>
    <circle cx="10" cy="20" r="2" fill="#3B82F6"/>
    <circle cx="20" cy="20" r="2" fill="#3B82F6"/>
    <circle cx="30" cy="20" r="2" fill="#3B82F6"/>
  </g>
</svg>
`;

async function generateIcons() {
  const iconsDir = 'public/icons';
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('🎨 Generating PWA icons...');

  for (const size of sizes) {
    try {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size} icon:`, error);
    }
  }

  // Generate apple-touch-icon (specifically for iOS)
  try {
    await sharp(Buffer.from(svgIcon))
      .resize(180, 180)
      .png()
      .toFile('public/apple-touch-icon.png');
    
    console.log('✅ Generated apple-touch-icon.png');
  } catch (error) {
    console.error('❌ Failed to generate apple-touch-icon:', error);
  }

  // Generate favicon
  try {
    await sharp(Buffer.from(svgIcon))
      .resize(32, 32)
      .png()
      .toFile('public/favicon.png');
    
    console.log('✅ Generated favicon.png');
  } catch (error) {
    console.error('❌ Failed to generate favicon:', error);
  }

  console.log('🎉 Icon generation complete!');
}

// Run if called directly
if (require.main === module) {
  generateIcons().catch(console.error);
}

export { generateIcons };
