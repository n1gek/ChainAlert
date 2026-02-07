// Cron Job: Check Active Sessions for Escalation
// This runs every 5 minutes to check if any sessions need escalation
// For Vercel: Add to vercel.json cron configuration
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
    // Verify this is coming from Vercel Cron (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Cron: Checking active sessions for escalation...');

    // Get all active sessions
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
        legal_alert: 0
      },
      errors: [] as string[]
    };

    // Check each session
    for (const session of sessions) {
      try {
        const phase = calculateEscalationPhase(session);

        if (phase) {
          console.log(`⚠️ Session ${session.sessionId} needs escalation: ${phase}`);

          // Check if we've already escalated to this phase
          // TODO: Store escalation history in database to avoid duplicate notifications
          const alreadyEscalated = await checkIfAlreadyEscalated(session.sessionId, phase);
          
          if (!alreadyEscalated) {
            // Execute escalation
            const manager = new EscalationManager(
              session.sessionId,
              session.userId,
              session
            );

            await manager.executePhase(phase);
            
            // Record escalation
            await recordEscalation(session.sessionId, phase);

            results.escalated++;
            results.phases[phase]++;
            
            console.log(`✅ Escalated session ${session.sessionId} to ${phase}`);
          } else {
            console.log(`ℹ️ Session ${session.sessionId} already escalated to ${phase}`);
          }
        }
      } catch (error) {
        console.error(`Error processing session ${session.sessionId}:`, error);
        results.errors.push(`Session ${session.sessionId}: ${(error as Error).message}`);
      }
    }

    console.log(`✅ Cron completed: ${results.escalated} escalations from ${results.checked} sessions`);

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

/**
 * Check if session has already been escalated to this phase
 * This prevents sending duplicate notifications
 */
async function checkIfAlreadyEscalated(
  sessionId: string,
  phase: string
): Promise<boolean> {
  try {
    // TODO: Query escalations collection
    // For now, return false to always escalate (will be fixed with database)
    // const escalationsRef = collection(db, 'escalations');
    // const q = query(
    //   escalationsRef,
    //   where('sessionId', '==', sessionId),
    //   where('phase', '==', phase)
    // );
    // const snapshot = await getDocs(q);
    // return !snapshot.empty;
    
    return false; // For now, always escalate
  } catch (error) {
    console.error('Error checking escalation history:', error);
    return false; // If error, allow escalation to proceed
  }
}

/**
 * Record escalation in database
 */
async function recordEscalation(
  sessionId: string,
  phase: string
): Promise<void> {
  try {
    // TODO: Store in escalations collection
    // const escalationRef = doc(collection(db, 'escalations'));
    // await setDoc(escalationRef, {
    //   escalationId: escalationRef.id,
    //   sessionId,
    //   phase,
    //   timestamp: Timestamp.now(),
    //   notificationsSent: true
    // });
    
    console.log(`📝 Recorded escalation: ${sessionId} -> ${phase}`);
  } catch (error) {
    console.error('Error recording escalation:', error);
    // Don't throw - escalation already sent
  }
}

/**
 * Manual trigger endpoint (for testing)
 */
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

    // Get specific session
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

    // Execute escalation
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
