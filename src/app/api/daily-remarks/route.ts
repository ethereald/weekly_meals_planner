import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dailyRemarks, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    return payload?.userId || null;
  } catch (error) {
    return null;
  }
}

// GET - Get shared remark for a specific date
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Get the shared remark for this date (no user filtering)
    const result = await db
      .select({
        id: dailyRemarks.id,
        date: dailyRemarks.date,
        remark: dailyRemarks.remark,
        createdAt: dailyRemarks.createdAt,
        updatedAt: dailyRemarks.updatedAt,
        creator: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
        },
        lastModifiedBy: dailyRemarks.lastModifiedBy,
      })
      .from(dailyRemarks)
      .leftJoin(users, eq(dailyRemarks.userId, users.id))
      .where(eq(dailyRemarks.date, date))
      .limit(1);

    const remark = result[0] || null;

    // If there's a lastModifiedBy, get that user's info too
    let lastModifiedByUser = null;
    if (remark?.lastModifiedBy) {
      const [modifiedByUser] = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
        })
        .from(users)
        .where(eq(users.id, remark.lastModifiedBy))
        .limit(1);
      lastModifiedByUser = modifiedByUser || null;
    }

    return NextResponse.json({ 
      remark: remark ? {
        ...remark,
        lastModifiedByUser
      } : null 
    });
  } catch (error) {
    console.error('Error fetching daily remark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update shared remark for a date
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/daily-remarks - Starting request');
    
    const userId = await getUserFromToken(request);
    console.log('User ID from token:', userId);
    
    if (!userId) {
      console.log('No user ID found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { date, remark } = body;

    if (!date || !remark) {
      console.log('Missing date or remark:', { date, remark });
      return NextResponse.json({ error: 'Date and remark are required' }, { status: 400 });
    }

    console.log('Checking for existing remark...');
    // Check if a shared remark already exists for this date
    const [existingRemark] = await db
      .select()
      .from(dailyRemarks)
      .where(eq(dailyRemarks.date, date))
      .limit(1);

    console.log('Existing remark:', existingRemark);

    let result;
    if (existingRemark) {
      console.log('Updating existing shared remark...');
      // Update existing shared remark
      [result] = await db
        .update(dailyRemarks)
        .set({
          remark,
          lastModifiedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(dailyRemarks.date, date))
        .returning();
    } else {
      console.log('Creating new shared remark...');
      // Create new shared remark
      [result] = await db
        .insert(dailyRemarks)
        .values({
          userId, // Creator
          date,
          remark,
          lastModifiedBy: userId,
        })
        .returning();
    }

    console.log('Result:', result);
    return NextResponse.json({ remark: result });
  } catch (error) {
    console.error('Error saving daily remark:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// DELETE - Delete shared remark for a date
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    // Delete the shared remark for this date (any user can delete)
    await db
      .delete(dailyRemarks)
      .where(eq(dailyRemarks.date, date));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting daily remark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
