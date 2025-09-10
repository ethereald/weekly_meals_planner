import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { dailyRemarks, users } from '@/lib/db/schema';
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

// GET - Get remarks for multiple dates (shared remarks system)
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

    // Fetch shared remarks with creator and modifier information
    const remarks = await db
      .select({
        date: dailyRemarks.date,
        remark: dailyRemarks.remark,
        createdAt: dailyRemarks.createdAt,
        updatedAt: dailyRemarks.updatedAt,
        createdBy: dailyRemarks.userId,
        lastModifiedBy: dailyRemarks.lastModifiedBy,
        creatorName: users.username,
        creatorDisplayName: users.displayName
      })
      .from(dailyRemarks)
      .leftJoin(users, eq(dailyRemarks.userId, users.id))
      .where(inArray(dailyRemarks.date, dates));

    // Get modifier names for remarks that have been modified
    const remarksWithModifiers = await Promise.all(
      remarks.map(async (remark) => {
        let modifierName = null;
        let modifierDisplayName = null;
        if (remark.lastModifiedBy && remark.lastModifiedBy !== remark.createdBy) {
          const modifier = await db
            .select({ 
              username: users.username,
              displayName: users.displayName 
            })
            .from(users)
            .where(eq(users.id, remark.lastModifiedBy))
            .limit(1);
          
          modifierName = modifier[0]?.username || null;
          modifierDisplayName = modifier[0]?.displayName || null;
        }

        return {
          date: remark.date,
          remark: remark.remark,
          createdAt: remark.createdAt,
          updatedAt: remark.updatedAt,
          createdBy: remark.createdBy,
          lastModifiedBy: remark.lastModifiedBy,
          creatorName: remark.creatorDisplayName || remark.creatorName,
          modifierName: modifierDisplayName || modifierName
        };
      })
    );

    // Convert to a map for easier lookup
    const remarksMap: Record<string, any> = {};
    remarksWithModifiers.forEach(remark => {
      remarksMap[remark.date] = {
        text: remark.remark,
        createdAt: remark.createdAt,
        updatedAt: remark.updatedAt,
        createdBy: remark.createdBy,
        lastModifiedBy: remark.lastModifiedBy,
        creatorName: remark.creatorName,
        modifierName: remark.modifierName
      };
    });

    return NextResponse.json({ remarks: remarksMap });
  } catch (error) {
    console.error('Error fetching daily remarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
