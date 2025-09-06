import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db/utils';

export async function GET() {
  try {
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          status: 'warning',
          database: 'not configured',
          message: 'Database not configured for this environment',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
