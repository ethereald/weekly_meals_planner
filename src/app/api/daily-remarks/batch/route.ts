import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dailyRemarks } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
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

// GET - Get remarks for multiple dates
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const datesParam = searchParams.get('dates');

    if (!datesParam) {
      return NextResponse.json({ error: 'Dates parameter is required' }, { status: 400 });
    }

    const dates = datesParam.split(',');

    const remarks = await db
      .select()
      .from(dailyRemarks)
      .where(and(
        eq(dailyRemarks.userId, userId),
        inArray(dailyRemarks.date, dates)
      ));

    // Convert to a map for easier lookup
    const remarksMap: Record<string, string> = {};
    remarks.forEach(remark => {
      remarksMap[remark.date] = remark.remark;
    });

    return NextResponse.json({ remarks: remarksMap });
  } catch (error) {
    console.error('Error fetching daily remarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
