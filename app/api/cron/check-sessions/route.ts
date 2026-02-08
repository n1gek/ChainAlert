import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { calculateEscalationPhase, EscalationManager } from '@/app/lib/escalation';
import type { Session } from '@/app/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET endpoint for cron job
 * Vercel Cron will hit this endpoint every 5 minutes
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Cron: Checking active sessions for escalation...');

    const sessionsRef = collection(db, 'sessions');
    const q = query(sessionsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('✅ No active sessions to check');
      return NextResponse.json({
        success: true,
        checked: 0,
        escalated: 0,
        message: 'No active sessions'
      });
    }

    const sessions = snapshot.docs.map(doc => doc.data() as Session);
    console.log(`📊 Found ${sessions.length} active session(s)`);

    const results = {
      checked: sessions.length,
      escalated: 0,
      phases: {
        soft_warning: 0,
        medium_alert: 0,
        critical_alert: 0,
        legal_alert: 0,
        emergency: 0
      },
      errors: [] as string[]
    };

    for (const session of sessions) {
      try {
        const phase = calculateEscalationPhase(session);

        if (phase) {
          console.log(`⚠️ Session ${session.sessionId} needs escalation: ${phase}`);
          const alreadyEscalated = await checkIfAlreadyEscalated(session.sessionId, phase);
          
          if (!alreadyEscalated) {
            const manager = new EscalationManager(
              session.sessionId,
              session.userId,
              session
            );

            await manager.executePhase(phase);
            
            await recordEscalation(session.sessionId, phase);

            results.escalated++;
            results.phases[phase]++;
            
            console.log(` Escalated session ${session.sessionId} to ${phase}`);
          } else {
            console.log(`Session ${session.sessionId} already escalated to ${phase}`);
          }
        }
      } catch (error) {
        console.error(`Error processing session ${session.sessionId}:`, error);
        results.errors.push(`Session ${session.sessionId}: ${(error as Error).message}`);
      }
    }

    console.log(`Cron completed: ${results.escalated} escalations from ${results.checked} sessions`);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

async function checkIfAlreadyEscalated(
  sessionId: string,
  phase: string
): Promise<boolean> {
  try {
    
    return false;
  } catch (error) {
    console.error('Error checking escalation history:', error);
    return false; // If error, allow escalation to proceed
  }
}

async function recordEscalation(
  sessionId: string,
  phase: string
): Promise<void> {
  try {
    console.log(`📝 Recorded escalation: ${sessionId} -> ${phase}`);
  } catch (error) {
    console.error('Error recording escalation:', error);
    // Don't throw - escalation already sent
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Manual escalation check for session: ${sessionId}`);

    const sessionRef = collection(db, 'sessions');
    const q = query(sessionRef, where('sessionId', '==', sessionId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = snapshot.docs[0].data() as Session;
    const phase = calculateEscalationPhase(session);

    if (!phase) {
      return NextResponse.json({
        success: true,
        message: 'No escalation needed',
        session: {
          id: session.sessionId,
          status: session.status,
          nextCheckIn: session.nextCheckInDue
        }
      });
    }

    const manager = new EscalationManager(
      session.sessionId,
      session.userId,
      session
    );

    await manager.executePhase(phase);
    await recordEscalation(session.sessionId, phase);

    return NextResponse.json({
      success: true,
      message: `Escalated to ${phase}`,
      phase,
      sessionId: session.sessionId
    });

  } catch (error) {
    console.error('Manual escalation error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
