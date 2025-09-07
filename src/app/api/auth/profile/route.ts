import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { getUserByUsername, getUserSettings } from '@/lib/db/utils';

async function handler(request: AuthenticatedRequest) {
  try {
    const user = request.user!;

    // Get user details
    const userDetails = await getUserByUsername(user.username);
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user settings
    const userSettings = await getUserSettings(user.userId);

    return NextResponse.json({
      user: {
        id: userDetails.id,
        username: userDetails.username,
        role: userDetails.role,
        createdAt: userDetails.createdAt,
        updatedAt: userDetails.updatedAt,
      },
      settings: userSettings,
    });

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
