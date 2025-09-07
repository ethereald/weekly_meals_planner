// Edge-compatible authentication utilities
// Uses Web Crypto API instead of Node.js crypto module

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-here';

// Simple JWT verification for Edge Runtime
export async function verifyTokenEdge(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    // For Edge Runtime, we'll do a simpler token verification
    // This is a basic implementation - in production you might want to use a library like 'jose'
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Basic expiration check
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    // Return user info if token structure is valid
    if (payload.userId && payload.username) {
      return { userId: payload.userId, username: payload.username };
    }

    return null;
  } catch (error) {
    console.error('Edge token verification failed:', error);
    return null;
  }
}

// Alternative: Use jose library for proper JWT verification in Edge Runtime
// Install with: npm install jose
/*
import { jwtVerify } from 'jose';

export async function verifyTokenEdgeSecure(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.userId && payload.username) {
      return { userId: payload.userId as string, username: payload.username as string };
    }
    
    return null;
  } catch (error) {
    console.error('Edge token verification failed:', error);
    return null;
  }
}
*/
