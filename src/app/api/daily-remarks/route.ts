import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dailyRemarks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

// GET - Get remark for a specific date
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

    const [remark] = await db
      .select()
      .from(dailyRemarks)
      .where(and(
        eq(dailyRemarks.userId, userId),
        eq(dailyRemarks.date, date)
      ))
      .limit(1);

    return NextResponse.json({ remark: remark || null });
  } catch (error) {
    console.error('Error fetching daily remark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update remark for a date
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
    // Check if remark already exists for this date
    const [existingRemark] = await db
      .select()
      .from(dailyRemarks)
      .where(and(
        eq(dailyRemarks.userId, userId),
        eq(dailyRemarks.date, date)
      ))
      .limit(1);

    console.log('Existing remark:', existingRemark);

    let result;
    if (existingRemark) {
      console.log('Updating existing remark...');
      // Update existing remark
      [result] = await db
        .update(dailyRemarks)
        .set({
          remark,
          updatedAt: new Date(),
        })
        .where(and(
          eq(dailyRemarks.userId, userId),
          eq(dailyRemarks.date, date)
        ))
        .returning();
    } else {
      console.log('Creating new remark...');
      // Create new remark
      [result] = await db
        .insert(dailyRemarks)
        .values({
          userId,
          date,
          remark,
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

// DELETE - Delete remark for a date
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

    await db
      .delete(dailyRemarks)
      .where(and(
        eq(dailyRemarks.userId, userId),
        eq(dailyRemarks.date, date)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting daily remark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
