import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    if (request.method === 'PUT') {
      const { displayName } = await request.json();

      // Validate display name
      if (displayName !== null && displayName !== undefined) {
        if (typeof displayName !== 'string') {
          return NextResponse.json(
            { error: 'Display name must be a string' },
            { status: 400 }
          );
        }

        if (displayName.length > 255) {
          return NextResponse.json(
            { error: 'Display name must be less than 255 characters' },
            { status: 400 }
          );
        }
      }

      // Update user's display name
      const updatedData = {
        displayName: displayName?.trim() || null,
        updatedAt: new Date(),
      };

      await db
        .update(users)
        .set(updatedData)
        .where(eq(users.id, user.userId));

      // Fetch updated user data
      const updatedUser = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, user.userId))
        .limit(1);

      if (!updatedUser[0]) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Profile updated successfully',
        user: updatedUser[0],
      });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(handler);
