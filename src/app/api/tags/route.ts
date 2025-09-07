import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db, tags } from '@/lib/db';

async function getHandler(request: AuthenticatedRequest) {
  try {
    // Get all existing tags
    const allTags = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(tags)
      .orderBy(tags.name);

    return NextResponse.json({ tags: allTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export const GET = withAuth(getHandler);
