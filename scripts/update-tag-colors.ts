import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tags } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

// Color palette with distinct colors
const tagColors = [
  '#DC2626', // red-600 - bright red
  '#059669', // emerald-600 - green
  '#D97706', // amber-600 - orange
  '#7C3AED', // violet-600 - purple
  '#DB2777', // pink-600 - hot pink
  '#0891B2', // cyan-600 - cyan
  '#CA8A04', // yellow-600 - gold
  '#1D4ED8', // blue-600 - royal blue
  '#047857', // emerald-700 - dark green
  '#B91C1C', // red-700 - dark red
  '#7C2D12', // orange-800 - brown
  '#6B21A8', // purple-800 - deep purple
];

// Hash function to consistently assign colors based on tag name
function getColorForTag(tagName: string): string {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % tagColors.length;
  return tagColors[colorIndex];
}

async function updateTagColors() {
  try {
    console.log('🎨 Starting tag color update...');
    
    // Get all existing tags
    const allTags = await db.select().from(tags);
    console.log(`📋 Found ${allTags.length} tags to update`);
    
    // Update each tag with a consistent color based on its name
    for (const tag of allTags) {
      const newColor = getColorForTag(tag.name);
      
      await db
        .update(tags)
        .set({ color: newColor })
        .where(eq(tags.id, tag.id));
      
      console.log(`✅ Updated tag "${tag.name}" to color ${newColor}`);
    }
    
    console.log('🎉 Tag color update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating tag colors:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  updateTagColors().catch(console.error);
}

export { updateTagColors };
