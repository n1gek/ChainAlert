// Notify Emergency and Legal Contacts API
import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/app/lib/database';
import type { Session } from '@/app/lib/types';

interface ContactNotificationRequest {
  type: 'critical_alert' | 'legal_alert' | 'emergency';
  userId: string;
  sessionId: string;
  session: Session;
  location: any;
  contactType?: 'emergency_only' | 'legal_only';  // Specify who to notify
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ContactNotificationRequest;
    const { type, userId, sessionId, session, location, contactType } = body;

    // Check for SendGrid API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not configured - contact notifications disabled');
      return NextResponse.json({
        success: false,
        message: 'Email service not configured'
      }, { status: 503 });
    }

    // Get user profile with contacts
    const userProfile = await userDB.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const results = {
      emergency: [] as any[],
      legal: [] as any[],
      errors: [] as string[]
    };

    // Send to emergency contacts (if not legal_only)
    const emergencyContacts = (contactType !== 'legal_only') 
      ? (userProfile.emergencyContacts?.filter(c => !c.metadata?.isLegal) || []) 
      : [];
    if (emergencyContacts.length > 0) {
      for (const contact of emergencyContacts) {
        try {
          const emailResult = await sendContactEmail(
            apiKey,
            contact.email || '',
            contact.name,
            type,
            session,
            location,
            userProfile.fullName || 'User'
          );
          results.emergency.push({ contact: contact.name, success: true, emailId: emailResult.id });
        } catch (error) {
          console.error(`Failed to notify ${contact.name}:`, error);
          results.errors.push(`Failed to notify ${contact.name}: ${(error as Error).message}`);
        }
      }
    }

    // Send to legal contacts (if not emergency_only)
    const legalContacts = (contactType !== 'emergency_only')
      ? (userProfile.emergencyContacts?.filter(c => c.metadata?.isLegal) || [])
      : [];
    if (legalContacts.length > 0) {
      for (const contact of legalContacts) {
        try {
          const emailResult = await sendLegalEmail(
            apiKey,
            contact.email || '',
            contact.name,
            contact.metadata?.organization || 'Legal Organization',
            type,
            session,
            location,
            userProfile.fullName || 'User'
          );
          results.legal.push({ contact: contact.name, success: true, emailId: emailResult.id });
        } catch (error) {
          console.error(`Failed to notify legal contact ${contact.name}:`, error);
          results.errors.push(`Failed to notify ${contact.name}: ${(error as Error).message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      notified: {
        emergencyContacts: results.emergency.length,
        legalContacts: results.legal.length
      },
      details: results,
      message: `Notified ${results.emergency.length} emergency and ${results.legal.length} legal contacts`
    });

  } catch (error) {
    console.error('Error notifying contacts:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Send email to emergency contact
 */
async function sendContactEmail(
  apiKey: string,
  email: string,
  contactName: string,
  type: string,
  session: Session,
  location: any,
  userName: string
): Promise<any> {
  const subject = type === 'emergency'
    ? `🚨 EMERGENCY: ${userName} needs help`
    : `⚠️ URGENT: ${userName} hasn't checked in`;

  const locationStr = location?.address || location?.lat ? 
    `${location.address || ''} (${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)})` :
    'Location unavailable';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${type === 'emergency' ? '#7F1D1D' : '#DC2626'}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 3px solid #DC2626; }
        .alert-box { background: #FEE2E2; padding: 15px; border-left: 4px solid #DC2626; margin: 20px 0; }
        .action { background: #7F1D1D; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">${type === 'emergency' ? '🚨 EMERGENCY ALERT' : '⚠️ CRITICAL SAFETY ALERT'}</h1>
        </div>
        <div class="content">
          <p>Hi ${contactName},</p>
          <div class="alert-box">
            <strong>You are receiving this because you are listed as an emergency contact for ${userName}.</strong>
          </div>
          
          ${type === 'emergency' ? `
            <div class="action">
              <h2 style="margin: 0;">EMERGENCY BUTTON ACTIVATED</h2>
              <p>${ userName} has triggered an emergency alert and may need immediate help.</p>
            </div>
          ` : `
            <p><strong>${userName} has not checked in for their safety session and may need assistance.</strong></p>
          `}
          
          <p><strong>What we know:</strong></p>
          <ul>
            <li><strong>Last Known Location:</strong> ${locationStr}</li>
            <li><strong>Session Started:</strong> ${new Date(session.startedAt.toMillis()).toLocaleString()}</li>
            <li><strong>Protection Level:</strong> ${session.protectionLevel}</li>
            <li><strong>Destination:</strong> ${session.destination || 'Not specified'}</li>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>

          <p><strong>Recommended Actions:</strong></p>
          <ol>
            <li>Try calling/texting ${userName} immediately</li>
            <li>Check their last known location if possible</li>
            <li>Contact other emergency contacts to coordinate</li>
            <li>If you cannot reach them within 30 minutes, consider contacting local authorities</li>
          </ol>

          <div class="alert-box">
            <strong>⚠️ If you believe ${userName} is in immediate danger, call 911 now.</strong>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            You received this automated alert from ChainAlert because ${userName} listed you as an emergency contact. 
            If this is an error or you need to update your contact information, please contact them directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: email }],
          subject: subject
        }
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@chainalert.com',
        name: 'ChainAlert'
      },
      content: [
        {
          type: 'text/html',
          value: html
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('SendGrid API error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }

  return { id: 'sent' };
}

/**
 * Send email to legal contact
 */
async function sendLegalEmail(
  apiKey: string,
  email: string,
  contactName: string,
  organization: string,
  type: string,
  session: Session,
  location: any,
  userName: string
): Promise<any> {
  const isLegalAlert = type === 'legal_alert';
  const subject = isLegalAlert 
    ? `🚨 URGENT: 24-Hour Safety Escalation - ${userName}`
    : `🚨 Legal Alert: ${userName} - Safety Session Escalated`;

  const locationStr = location?.address || location?.lat ? 
    `${location.address || ''} (${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)})` :
    'Location unavailable';

  const escalationMessage = isLegalAlert
    ? 'No check-in activity for 24+ hours - Case requires legal attention'
    : 'Critical safety escalation - Check-in overdue 60+ minutes';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isLegalAlert ? '#7F1D1D' : '#1E40AF'}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 2px solid ${isLegalAlert ? '#7F1D1D' : '#1E40AF'}; }
        .info-box { background: ${isLegalAlert ? '#FEE2E2' : '#DBEAFE'}; padding: 15px; border-left: 4px solid ${isLegalAlert ? '#7F1D1D' : '#1E40AF'}; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚨 ${isLegalAlert ? 'URGENT LEGAL ESCALATION' : 'Legal Organization Alert'}</h1>
          <p style="margin: 5px 0 0 0;">${organization}</p>
        </div>
        <div class="content">
          <p>Dear ${contactName},</p>
          
          <div class="info-box">
            <strong>${isLegalAlert ? '⚠️ 24-Hour Safety Escalation' : 'Critical Safety Escalation Alert'}</strong>
            <p style="margin: 5px 0 0 0;">${escalationMessage}</p>
          </div>

          <p>One of your protected individuals has reached a ${isLegalAlert ? 'critical legal' : 'critical safety'} escalation:</p>

          <p><strong>Individual Information:</strong></p>
          <ul>
            <li><strong>Name:</strong> ${userName}</li>
            <li><strong>Last Known Location:</strong> ${locationStr}</li>
            <li><strong>Session Type:</strong> ${session?.protectionLevel || 'Unknown'}</li>
            <li><strong>Alert Time:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>Session Started:</strong> ${session?.startedAt ? new Date((session.startedAt as any).toMillis?.() || Date.now()).toLocaleString() : 'Unknown'}</li>
          </ul>

          ${isLegalAlert ? `
            <p><strong>RECOMMENDED IMMEDIATE ACTIONS:</strong></p>
            <ol>
              <li><strong>Contact local law enforcement</strong> to request a welfare check</li>
              <li><strong>File a missing person/detention report</strong> if individual cannot be located</li>
              <li><strong>Attempt legal intervention</strong> through appropriate channels</li>
              <li><strong>Monitor ChainAlert system</strong> for updates and additional documentation</li>
            </ol>
          ` : `
            <p><strong>Escalation Status:</strong> Critical - Check-in now 60+ minutes overdue</p>
          `}

          <p><strong>Available Documentation:</strong></p>
          <ul>
            <li>✓ Signed consent forms (on file)</li>
            <li>✓ Complete session audit trail</li>
            <li>✓ GPS location tracking data</li>
            <li>✓ Emergency contact list</li>
            ${isLegalAlert ? '<li>✓ 24-hour no-activity report</li>' : ''}
          </ul>

          <p>As a consented legal organization, you have been notified per the individual's request. 
          ${isLegalAlert ? 'This 24-hour escalation indicates the individual may require legal intervention.' : 'Emergency contacts have also been notified and are attempting to reach the individual.'}</p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
            This notification is sent in accordance with the individual's signed consent form. 
            For questions about ChainAlert's legal notification system, contact: legal@chainalert.app
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: email }],
          subject: subject
        }
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@chainalert.com',
        name: 'ChainAlert'
      },
      content: [
        {
          type: 'text/html',
          value: html
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('SendGrid API error:', error);
    throw new Error(`Failed to send email: ${error}`);
  }

  return { id: 'sent' };
}
