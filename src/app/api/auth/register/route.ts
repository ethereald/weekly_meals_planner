import { NextRequest, NextResponse } from 'next/server';
import { db, users, isDatabaseAvailable, initializeDatabase } from '@/lib/db';
import { hashPassword, validateUsername, validatePassword, generateToken } from '@/lib/auth';
import { getUserByUsername, createDefaultUserSettings } from '@/lib/db/utils';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: usernameValidation.error },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if database is available
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: 'Database not available. Please check your database configuration.' },
        { status: 503 }
      );
    }

    // Initialize database if needed
    try {
      await initializeDatabase();
    } catch (initError) {
      console.error('Database initialization failed:', initError);
      return NextResponse.json(
        { error: 'Database initialization failed' },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Check if this is the first user (should be admin)
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const isFirstUser = userCount[0]?.count === 0;
    
    // Set role: first user becomes admin, others become regular users
    const userRole = isFirstUser ? 'admin' : 'user';

    // Create user
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      role: userRole,
    }).returning({
      id: users.id,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    });

    // Create default user settings
    await createDefaultUserSettings(newUser.id);

    // Generate token
    const token = generateToken(newUser.id, newUser.username);

    // Create response with token in HTTP-only cookie
    const response = NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        createdAt: newUser.createdAt,
      },
      token,
    }, { status: 201 });

    // Set HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
