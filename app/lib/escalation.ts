// Escalation Manager for handling emergency notifications
import { Timestamp } from 'firebase/firestore';
import type { Session } from './types';

export type EscalationPhase = 'soft_warning' | 'medium_alert' | 'critical_alert' | 'legal_alert' | 'emergency';

export interface EscalationConfig {
  softWarningMinutes: number;     // Phase 1: 0-15 min (in-app)
  mediumAlertMinutes: number;     // Phase 2: 15-60 min (email to user)
  criticalAlertMinutes: number;   // Phase 3: 60 min (emergency contacts)
  legalAlertMinutes: number;      // Phase 4: 1440 min / 24 hours (legal services)
}

export const DEFAULT_ESCALATION_CONFIG: EscalationConfig = {
  softWarningMinutes: 0,
  mediumAlertMinutes: 15,
  criticalAlertMinutes: 60,
  legalAlertMinutes: 1440  // 24 hours
};

/**
 * Calculate which escalation phase a session should be in based on time elapsed
 */
export function calculateEscalationPhase(session: Session): EscalationPhase | null {
  if (session.status !== 'active') {
    return null;
  }

  const now = Date.now();
  const nextCheckInDue = session.nextCheckInDue?.toMillis() || now;
  
  // If timer hasn't expired yet, no escalation
  if (now < nextCheckInDue) {
    return null;
  }

  // Calculate minutes overdue
  const minutesOverdue = Math.floor((now - nextCheckInDue) / (60 * 1000));

  // Determine escalation phase
  if (minutesOverdue >= DEFAULT_ESCALATION_CONFIG.legalAlertMinutes) {
    return 'legal_alert';
  } else if (minutesOverdue >= DEFAULT_ESCALATION_CONFIG.criticalAlertMinutes) {
    return 'critical_alert';
  } else if (minutesOverdue >= DEFAULT_ESCALATION_CONFIG.mediumAlertMinutes) {
    return 'medium_alert';
  } else if (minutesOverdue >= DEFAULT_ESCALATION_CONFIG.softWarningMinutes) {
    return 'soft_warning';
  }

  return null;
}

/**
 * Get time until next escalation phase
 */
export function getTimeUntilNextPhase(session: Session): number | null {
  const phase = calculateEscalationPhase(session);
  
  if (!phase) return null;

  const now = Date.now();
  const nextCheckInDue = session.nextCheckInDue?.toMillis() || now;
  const minutesOverdue = Math.floor((now - nextCheckInDue) / (60 * 1000));

  switch (phase) {
    case 'soft_warning':
      return DEFAULT_ESCALATION_CONFIG.mediumAlertMinutes - minutesOverdue;
    case 'medium_alert':
      return DEFAULT_ESCALATION_CONFIG.criticalAlertMinutes - minutesOverdue;
    case 'critical_alert':
      return DEFAULT_ESCALATION_CONFIG.legalAlertMinutes - minutesOverdue;
    case 'legal_alert':
      return null; // Already at max escalation
    default:
      return null;
  }
}

/**
 * EscalationManager class for handling notification logic
 */
export class EscalationManager {
  private sessionId: string;
  private userId: string;
  private session: Session;

  constructor(sessionId: string, userId: string, session: Session) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.session = session;
  }

  /**
   * Execute escalation for current phase
   */
  async executePhase(phase: EscalationPhase): Promise<void> {
    console.log(`Executing escalation phase: ${phase} for session ${this.sessionId}`);

    try {
      switch (phase) {
        case 'soft_warning':
          await this.executeSoftWarning();
          break;

        case 'medium_alert':
          await this.executeMediumAlert();
          break;

        case 'critical_alert':
          await this.executeCriticalAlert();
          break;

        case 'legal_alert':
          await this.executeLegalAlert();
          break;

        case 'emergency':
          await this.executeEmergency();
          break;
      }
    } catch (error) {
      console.error(`Error executing escalation phase ${phase}:`, error);
      throw error;
    }
  }

  /**
   * Phase 1: Soft warnings (in-app, push notifications)
   */
  private async executeSoftWarning(): Promise<void> {
    console.log('Phase 1: Soft warning - sending in-app notifications');
    
    // TODO: Implement push notification
    // await this.sendPushNotification({
    //   title: 'Safety Check Required',
    //   body: 'Please check in to confirm you\'re safe',
    //   sessionId: this.sessionId
    // });

    // Record escalation in database
    await this.logEscalation('soft_warning', 'In-app notification sent');
  }

  /**
   * Phase 2: Medium alert (email + optional SMS)
   */
  private async executeMediumAlert(): Promise<void> {
    console.log('Phase 2: Medium alert - sending email to user');

    try {
      // Send email to user
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'medium_alert',
          userId: this.userId,
          sessionId: this.sessionId,
          session: this.session
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }

      // TODO: Send SMS if enabled
      // await this.sendSMSIfEnabled();

      await this.logEscalation('medium_alert', 'Email notification sent');
    } catch (error) {
      console.error('Error in medium alert:', error);
      throw error;
    }
  }

  /**
   * Phase 3: Critical alert (notify emergency contacts only)
   */
  private async executeCriticalAlert(): Promise<void> {
    console.log('Phase 3: Critical alert - notifying emergency contacts');

    try {
      // Notify emergency contacts only (60+ minutes)
      const response = await fetch('/api/notifications/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'critical_alert',
          userId: this.userId,
          sessionId: this.sessionId,
          session: this.session,
          location: this.session.location,
          contactType: 'emergency_only'  // Only emergency contacts, not legal
        })
      });

      if (!response.ok) {
        throw new Error('Failed to notify emergency contacts');
      }

      await this.logEscalation('critical_alert', 'Emergency contacts notified');
    } catch (error) {
      console.error('Error in critical alert:', error);
      throw error;
    }
  }

  /**
   * Phase 4: Legal alert (notify legal services after 24 hours)
   */
  private async executeLegalAlert(): Promise<void> {
    console.log('Phase 4: Legal alert - notifying legal services');

    try {
      // Notify legal services only (24+ hours)
      const response = await fetch('/api/notifications/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'legal_alert',
          userId: this.userId,
          sessionId: this.sessionId,
          session: this.session,
          location: this.session.location,
          contactType: 'legal_only'  // Only legal contacts
        })
      });

      if (!response.ok) {
        throw new Error('Failed to notify legal services');
      }

      await this.logEscalation('legal_alert', 'Legal services notified');
    } catch (error) {
      console.error('Error in legal alert:', error);
      throw error;
    }
  }

  /**
   * Emergency: Instant notification to all contacts
   */
  private async executeEmergency(): Promise<void> {
    console.log('EMERGENCY: Notifying all contacts immediately');

    try {
      // Send to all contacts instantly
      const response = await fetch('/api/notifications/emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.userId,
          sessionId: this.sessionId,
          session: this.session,
          location: this.session.location,
          documents: true // Include consent/legal docs
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send emergency notifications');
      }

      await this.logEscalation('emergency', 'Emergency notifications sent to all contacts');
    } catch (error) {
      console.error('Error in emergency escalation:', error);
      throw error;
    }
  }

  /**
   * Log escalation action to audit log
   */
  private async logEscalation(phase: EscalationPhase, details: string): Promise<void> {
    // This will be stored in the escalations collection
    console.log(`Escalation logged: ${phase} - ${details}`);
    
    // TODO: Store in Firestore escalations collection
    // await escalationDB.create({
    //   sessionId: this.sessionId,
    //   userId: this.userId,
    //   phase,
    //   details,
    //   timestamp: Timestamp.now()
    // });
  }

  /**
   * Send SMS if user has opted in
   */
  private async sendSMSIfEnabled(): Promise<void> {
    // TODO: Check user preferences and send SMS
    console.log('SMS notifications not yet implemented');
  }
}

/**
 * Check if a session needs escalation
 */
export function needsEscalation(session: Session): boolean {
  const phase = calculateEscalationPhase(session);
  return phase !== null;
}

/**
 * Get escalation status for a session
 */
export function getEscalationStatus(session: Session) {
  const phase = calculateEscalationPhase(session);
  const timeUntilNext = getTimeUntilNextPhase(session);

  return {
    currentPhase: phase,
    nextPhase: phase === 'critical_alert' ? null : getNextPhase(phase),
    timeUntilNextPhase: timeUntilNext,
    needsAction: phase !== null
  };
}

/**
 * Get the next escalation phase
 */
function getNextPhase(currentPhase: EscalationPhase | null): EscalationPhase | null {
  switch (currentPhase) {
    case null:
      return 'soft_warning';
    case 'soft_warning':
      return 'medium_alert';
    case 'medium_alert':
      return 'critical_alert';
    case 'critical_alert':
      return null; // Max phase
    default:
      return null;
  }
}
