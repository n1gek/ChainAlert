// Session API Route
import { NextRequest, NextResponse } from 'next/server';
import { sessionDB } from '@/app/lib/database';
import type { ProtectionLevel } from '@/app/lib/types';

interface StartSessionRequest {
  userId: string;
  protectionLevel: ProtectionLevel;
  destination?: string;
  notes?: string;
  checkInIntervalMinutes: number;
  durationMinutes: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    address?: {
      city?: string;
      town?: string;
      village?: string;
      suburb?: string;
      neighbourhood?: string;
      county?: string;
      state?: string;
      country?: string;
      fullAddress: string;
    };
  };
}

// POST - Start a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      protectionLevel,
      destination,
      notes,
      checkInIntervalMinutes,
      durationMinutes,
      location
    } = body as StartSessionRequest;

    if (!userId || !protectionLevel || !checkInIntervalMinutes || !durationMinutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Start session with location data
    const sessionId = await sessionDB.startSession(userId, {
      protectionLevel,
      destination,
      notes,
      checkInIntervalMinutes,
      durationMinutes,
      location
    });

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Session started successfully'
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Failed to start session', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Get session status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const activeSessions = await sessionDB.getActiveSessions(userId);

    return NextResponse.json({
      activeSessions: activeSessions.length,
      sessions: activeSessions
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions', details: (error as Error).message },
      { status: 500 }
    );
  }
}
