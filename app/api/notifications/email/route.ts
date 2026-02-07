// Email Notification API
// Using SendGrid (100 emails/day free tier)
import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/app/lib/database';
import type { Session } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

interface EmailRequest {
  type: 'soft_warning' | 'medium_alert' | 'critical_alert' | 'emergency';
  userId: string;
  sessionId: string;
  session: Session;
  recipientEmail?: string;
  recipientName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EmailRequest;
    const { type, userId, sessionId, session, recipientEmail, recipientName } = body;

    // Check for SendGrid API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SENDGRID_API_KEY not configured - email notifications disabled');
      return NextResponse.json({
        success: false,
        message: 'Email service not configured'
      }, { status: 503 });
    }

    // Get user email from Firebase or pass it in
    let userEmail = recipientEmail;
    let userName = recipientName;

    if (!userEmail || !userName) {
      // Fetch from user profile
      const userProfile = await userDB.getUserProfile(userId);
      if (userProfile) {
        userEmail = userEmail || userProfile.email;
        userName = userName || userProfile.fullName;
      }
    }

    // Fallback to defaults
    userEmail = userEmail || 'user@example.com';
    userName = userName || 'User';

    // Build email content based on type
    const emailContent = buildEmailContent(type, session, userName);

    // Parse from email - handle both "Name <email>" and plain email formats
    let fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@chainalert.com';
    let fromName = 'ChainAlert';
    const emailMatch = fromEmail.match(/<(.+?)>/);
    if (emailMatch) {
      fromEmail = emailMatch[1];
      fromName = fromEmail.substring(0, fromEmail.indexOf('<')).trim() || 'ChainAlert';
    }
    
    const requestBody = {
      personalizations: [
        {
          to: [{ email: userEmail }],
          subject: emailContent.subject
        }
      ],
      from: {
        email: fromEmail,
        name: fromName
      },
      content: [
        {
          type: 'text/html',
          value: emailContent.html
        }
      ]
    };

    console.log(`📧 Sending ${type} email to ${userEmail}`, {
      from: fromEmail,
      fromName,
      type,
      hasContent: !!emailContent.html
    });

    // Send email using SendGrid
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log(`📨 SendGrid response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error(`❌ SendGrid API error (${response.status}):`, responseText);
      console.error('Request details:', {
        from: fromEmail,
        to: userEmail,
        type: type,
        bodyLength: JSON.stringify(requestBody).length
      });
      throw new Error(`SendGrid API error: ${responseText}`);
    }

    return NextResponse.json({
      success: true,
      message: `${type} email sent successfully`
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Build email content based on escalation type
 */
function buildEmailContent(
  type: string,
  session: Session | null | undefined,
  userName: string
): { subject: string; html: string } {
  // Handle null/undefined session
  if (!session) {
    session = {} as any;
  }
  
  const location = session?.location?.address || 'Location unavailable';
  const timeOverdue = session ? calculateOverdueTime(session) : 'Unknown';

  switch (type) {
    case 'soft_warning':
      return {
        subject: '⚠️ Safety Check Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FEF3C7; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { background: #fff; padding: 20px; }
              .button { display: inline-block; background: #EAB308; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0; color: #92400E;">⚠️ Safety Check Required</h2>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                <p>Your ChainAlert protection session requires a check-in.</p>
                <p><strong>Session Details:</strong></p>
                <ul>
                  <li>Protection Level: ${session?.protectionLevel || 'Unknown'}</li>
                  <li>Location: ${location}</li>
                  <li>Time Overdue: ${timeOverdue}</li>
                </ul>
                <p>Please check in within the next 15 minutes to prevent escalation.</p>
                <a href="https://chainalert.app/home" class="button">Check In Now</a>
              </div>
              <div class="footer">
                <p>This is an automated safety alert from ChainAlert.</p>
                <p>If you did not start this session, please contact support immediately.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'medium_alert':
      return {
        subject: '🔔 Urgent: Safety Check Overdue',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FED7AA; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { background: #fff; padding: 20px; }
              .button { display: inline-block; background: #EA580C; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .warning { background: #FEF3C7; padding: 15px; border-left: 4px solid #EAB308; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0; color: #7C2D12;">🔔 Urgent: Safety Check Overdue</h2>
              </div>
              <div class="content">
                <p>Hi ${userName},</p>
                <div class="warning">
                  <strong>⚠️ You have not checked in for ${timeOverdue}</strong>
                </div>
                <p>Your safety session has exceeded the check-in window:</p>
                <p><strong>Session Information:</strong></p>
                <ul>
                  <li>Protection Level: ${session?.protectionLevel || 'Unknown'}</li>
                  <li>Last Known Location: ${location}</li>
                  <li>Started: ${session?.startedAt ? (typeof session.startedAt === 'object' && 'toDate' in session.startedAt ? session.startedAt.toDate().toLocaleString() : new Date(session.startedAt).toLocaleString()) : 'Unknown'}</li>
                  <li>Time Overdue: ${timeOverdue}</li>
                </ul>
                <p><strong>Next Step:</strong> If no check-in within 60 minutes, your trusted contacts will be notified.</p>
                <a href="https://chainalert.app/home" class="button">Check In Immediately</a>
                <p style="margin-top: 20px; font-size: 14px; color: #666;">
                  If you're unable to check in, your emergency contacts will be alerted with your last known location.
                </p>
              </div>
              <div class="footer">
                <p>This is an automated escalation from ChainAlert Safety System.</p>
                <p>Emergency? Call 911 immediately.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'critical_alert':
      return {
        subject: '🚨 CRITICAL: Emergency Contacts Notified',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FECACA; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { background: #fff; padding: 20px; }
              .button { display: inline-block; background: #DC2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .critical { background: #FEE2E2; padding: 15px; border-left: 4px solid #DC2626; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0; color: #7F1D1D;">🚨 CRITICAL ALERT</h2>
              </div>
              <div class="content">
                <div class="critical">
                  <strong>🚨 Your emergency contacts have been notified</strong>
                </div>
                <p>Hi ${userName},</p>
                <p>Your safety session has been escalated to <strong>CRITICAL</strong> status.</p>
                <p><strong>Actions Taken:</strong></p>
                <ul>
                  <li>✅ All trusted contacts have been emailed</li>
                  <li>✅ Your last known location has been shared</li>
                  <li>✅ Legal organization has been notified (if consented)</li>
                </ul>
                <p><strong>Session Information:</strong></p>
                <ul>
                  <li>Protection Level: ${session?.protectionLevel || 'Unknown'}</li>
                  <li>Last Location: ${location}</li>
                  <li>Overdue: ${timeOverdue}</li>
                </ul>
                <a href="https://chainalert.app/home" class="button">I'M SAFE - Cancel Alert</a>
                <p style="margin-top: 20px; color: #DC2626; font-weight: bold;">
                  If you're in immediate danger, call 911 now.
                </p>
              </div>
              <div class="footer">
                <p>ChainAlert Critical Escalation System</p>
                <p>Your contacts have been instructed to try reaching you.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'emergency':
      return {
        subject: '🚨🚨 EMERGENCY ALERT - Immediate Action Required',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #7F1D1D; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { background: #fff; padding: 20px; border: 3px solid #DC2626; }
              .emergency { background: #7F1D1D; color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🚨 EMERGENCY ALERT 🚨</h1>
              </div>
              <div class="content">
                <div class="emergency">
                  <h2 style="margin: 0;">EMERGENCY BUTTON TRIGGERED</h2>
                  <p style="margin: 10px 0 0 0; font-size: 18px;">${userName} has activated emergency escalation</p>
                </div>
                <p><strong>IMMEDIATE ACTIONS REQUIRED:</strong></p>
                <ol>
                  <li><strong>${userName} is currently going through detention. </strong>
                    They activated chainAlert's emergency protocol before entering this situation. It is 
                    highly advised to check on their safety immediately! </li>
                  </li>
                  <li>Try contacting ${userName} immediately</li>
                  <li>Check their last known location (below)</li>
                  <li>Contact local authorities if necessary</li>
                </ol>
                <p><strong>Last Known Information:</strong></p>
                <ul>
                  <li><strong>Location:</strong> ${location}</li>
                  <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                  <li><strong>Session Type:</strong> ${session?.protectionLevel || 'Unknown'}</li>
                  <li><strong>Destination:</strong> ${session?.destination || 'Not specified'}</li>
                </ul>
                <p style="background: #FEE2E2; padding: 15px; border-left: 4px solid #DC2626;">
                  <strong>⚠️ This is a real emergency alert.</strong><br>
                  All emergency contacts and legal organizations have been notified.
                </p>
              </div>
              <div class="footer">
                <p>ChainAlert Emergency Response System</p>
                <p>If you believe this is an error, contact ChainAlert support.</p>
                <p><strong>Emergency Services: 911</strong></p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    default:
      return {
        subject: 'ChainAlert Safety Notification',
        html: '<p>Safety notification from ChainAlert</p>'
      };
  }
}

/**
 * Calculate how long session is overdue
 */
function calculateOverdueTime(session: Session): string {
  const now = Date.now();
  const nextCheckIn = session.nextCheckInDue?.toMillis() || now;
  const overdue = Math.max(0, now - nextCheckIn);
  
  const minutes = Math.floor(overdue / (60 * 1000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes} minutes`;
}
