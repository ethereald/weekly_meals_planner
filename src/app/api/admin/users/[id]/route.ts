import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, hashPassword } from '@/lib/auth';
import { isAdmin, getUserWithRole, promoteToAdmin, demoteFromAdmin } from '@/lib/admin';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface Context {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/admin/users/[id] - Get specific user details (admin only)
export async function GET(request: NextRequest, context: Context) {
  try {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin privileges
    const hasAdminAccess = await isAdmin(decoded.userId);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const params = await context.params;
    const userId = params.id;
    const user = await getUserWithRole(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user (admin only)
export async function PUT(request: NextRequest, context: Context) {
  try {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin privileges
    const hasAdminAccess = await isAdmin(decoded.userId);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const params = await context.params;
    const userId = params.id;
    const { username, displayName, password, role } = await request.json();

    // Check if user exists
    const targetUser = await getUserWithRole(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: Record<string, string> = {
      updatedAt: new Date().toISOString(),
    };

    // Update username if provided
    if (username && username !== targetUser.username) {
      // Check if new username already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
      updateData.username = username;
    }

    // Update display name if provided
    if (displayName !== undefined) {
      if (displayName && typeof displayName === 'string' && displayName.length > 255) {
        return NextResponse.json({ error: 'Display name must be less than 255 characters' }, { status: 400 });
      }
      updateData.displayName = displayName?.trim() || null;
    }

    // Update password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update role if provided
    if (role && role !== targetUser.role) {
      if (role === 'admin') {
        await promoteToAdmin(userId);
      } else if (role === 'user') {
        // Prevent admin from demoting themselves
        if (userId === decoded.userId) {
          return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
        }
        await demoteFromAdmin(userId);
      }
    }

    // Update other fields
    if (Object.keys(updateData).length > 1) { // More than just updatedAt
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    // Get updated user
    const updatedUser = await getUserWithRole(userId);

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete specific user (admin only)
export async function DELETE(request: NextRequest, context: Context) {
  try {
    // Check authentication
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check admin privileges
    const hasAdminAccess = await isAdmin(decoded.userId);
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const params = await context.params;
    const userId = params.id;

    // Prevent admin from deleting themselves
    if (userId === decoded.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await getUserWithRole(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
