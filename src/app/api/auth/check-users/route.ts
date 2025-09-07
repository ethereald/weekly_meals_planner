import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  console.log('Check users API called');
  
  try {
    if (!db) {
      console.log('Database not available');
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Check if any users exist in the database
    console.log('Querying user count...');
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log('User count query result:', userCount);
    
    const hasUsers = userCount[0]?.count > 0;
    console.log('Has users:', hasUsers, 'Count:', userCount[0]?.count);

    const result = { hasUsers };
    console.log('Returning result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking users:', error);
    return NextResponse.json({ error: 'Failed to check users' }, { status: 500 });
  }
}
