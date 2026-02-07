// Emergency Instant Notification API
// Triggered when user presses emergency button
import { NextRequest, NextResponse } from 'next/server';
import { sessionDB, userDB } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

interface EmergencyRequest {
  userId: string;
  sessionId: string;
  session: any;
  location: any;
  documents?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as EmergencyRequest;
    const { userId, sessionId, location, documents } = body;
    let session = body.session;

    console.log(`🚨 EMERGENCY TRIGGERED for session ${sessionId}`);
    console.log('📍 Location data received:', location);

    // Check for API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('SENDGRID_API_KEY not configured');
      return NextResponse.json({
        success: false,
        message: 'Emergency notification service not configured'
      }, { status: 503 });
    }

    // Get user profile
    const userProfile = await userDB.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Fetch full session from database
    try {
      const dbSession = await sessionDB.getSession(sessionId);
      if (dbSession) {
        session = dbSession;
      }
    } catch (error) {
      console.warn('Could not fetch session from database, using provided data', error);
    }

    const userName = userProfile.fullName || userProfile.email || 'User';
    const results = {
      userEmail: null as any,
      emergencyContacts: [] as any[],
      legalContacts: [] as any[],
      errors: [] as string[]
    };

    // 1. Send emergency email to user themselves
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'emergency',
          userId,
          sessionId,
          session,
          recipientEmail: userProfile.email,
          recipientName: userName
        })
      });

      if (response.ok) {
        const data = await response.json();
        results.userEmail = { success: true, emailId: data.emailId };
      }
    } catch (error) {
      console.error('Failed to send email to user:', error);
      results.errors.push('Failed to notify user');
    }

    // Wait before notifying contacts (rate limiting)
    await new Promise(resolve => setTimeout(resolve, 600));

    // 2. Notify ALL emergency contacts (with throttling to avoid rate limits)
    const emergencyContacts = userProfile.emergencyContacts?.filter(c => !c.metadata?.isLegal) || [];
    if (emergencyContacts.length > 0) {
      for (let i = 0; i < emergencyContacts.length; i++) {
        const contact = emergencyContacts[i];
        try {
          // Add delay between requests (600ms to stay under 2 requests/second limit)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 600));
          }
          
          try {
            const emailResult = await sendEmergencyContactEmail(
              apiKey,
              contact.email || '',
              contact.name,
              userName,
              session,
              location
            );
            console.log(`✅ Emergency email sent to ${contact.name}`);
            results.emergencyContacts.push({ 
              contact: contact.name, 
              success: true, 
              emailId: emailResult.id 
            });
          } catch (emailError) {
            console.error(`❌ Failed to send emergency email to ${contact.name}:`, emailError);
            results.emergencyContacts.push({ 
              contact: contact.name, 
              success: false, 
              error: (emailError as Error).message 
            });
          }
        } catch (error) {
          console.error(`Failed to notify ${contact.name}:`, error);
          results.emergencyContacts.push({ 
            contact: contact.name, 
            success: false, 
            error: (error as Error).message 
          });
        }
      }
    }

    // Wait before notifying legal contacts (rate limiting)
    const legalContacts = userProfile.emergencyContacts?.filter(c => c.metadata?.isLegal) || [];
    if (legalContacts.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // 3. Notify ALL legal contacts (with throttling to avoid rate limits)
    if (legalContacts.length > 0) {
      for (let i = 0; i < legalContacts.length; i++) {
        const contact = legalContacts[i];
        try {
          // Add delay between requests (600ms to stay under 2 requests/second limit)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 600));
          }
          
          try {
            const emailResult = await sendLegalEmergencyEmail(
              apiKey,
              contact.email || '',
              contact.name,
              contact.metadata?.organization || 'Legal Organization',
              userName,
              userProfile.email,
              session,
              location
            );
            console.log(`✅ Legal emergency email sent to ${contact.name}`);
            results.legalContacts.push({ 
              contact: contact.name, 
              success: true, 
              emailId: emailResult.id 
            });
          } catch (emailError) {
            console.error(`❌ Failed to send legal email to ${contact.name}:`, emailError);
            results.legalContacts.push({ 
              contact: contact.name, 
              success: false, 
              error: (emailError as Error).message 
            });
          }
        } catch (error) {
          console.error(`Failed to notify legal contact ${contact.name}:`, error);
          results.legalContacts.push({ 
            contact: contact.name, 
            success: false, 
            error: (error as Error).message 
          });
        }
      }
    }

    // 4. Update session status to emergency
    try {
      await sessionDB.endSession(sessionId, 'emergency');
    } catch (error) {
      console.warn('Failed to update session status (may already be ended):', (error as Error).message);
      // Don't fail the whole operation if session update fails
    }

    // Calculate success rate
    const totalNotifications = 
      results.emergencyContacts.length + 
      results.legalContacts.length + 
      (results.userEmail ? 1 : 0);
    
    const successfulNotifications = 
      results.emergencyContacts.filter(c => c.success).length +
      results.legalContacts.filter(c => c.success).length +
      (results.userEmail?.success ? 1 : 0);

    console.log(`Emergency notifications sent: ${successfulNotifications}/${totalNotifications}`);

    return NextResponse.json({
      success: successfulNotifications > 0,
      notificationsSent: successfulNotifications,
      totalRecipients: totalNotifications,
      breakdown: {
        user: results.userEmail?.success || false,
        emergencyContacts: results.emergencyContacts.filter(c => c.success).length,
        legalContacts: results.legalContacts.filter(c => c.success).length
      },
      details: results,
      message: `Emergency alert sent to ${successfulNotifications} recipients`
    });

  } catch (error) {
    console.error('Emergency notification error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * Send emergency email to contact
 */
async function sendEmergencyContactEmail(
  apiKey: string,
  email: string,
  contactName: string,
  userName: string,
  session: any | null | undefined,
  location: any
): Promise<any> {
  // Handle null/undefined session
  if (!session) {
    session = {};
  }
  
  console.log('📧 sendEmergencyContactEmail called with location:', location);
  const locationStr = formatLocation(location);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; }
        .header { background: #7F1D1D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; border: 4px solid #DC2626; border-top: none; border-radius: 0 0 8px 8px; }
        .emergency-banner { background: #7F1D1D; color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; font-size: 18px; font-weight: bold; }
        .info-box { background: #FEE2E2; padding: 20px; border-left: 4px solid #DC2626; margin: 20px 0; }
        .action-steps { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .location { background: #DBEAFE; padding: 20px; border-left: 4px solid #2563EB; margin: 20px 0; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">🚨 EMERGENCY 🚨</h1>
          <p style="margin: 10px 0 0 0; font-size: 20px;">IMMEDIATE ACTION REQUIRED</p>
        </div>
        <div class="content">
          <div class="emergency-banner">
            ${userName} HAS ACTIVATED EMERGENCY ALERT
          </div>

          <p style="font-size: 18px;"><strong>Hi ${contactName},</strong></p>

          <div class="info-box">
            <p style="margin: 0; font-size: 16px;"><strong>⚠️ ${userName} has triggered an emergency alert and may be in immediate danger or detention.</strong></p>
          </div>

          <div class="action-steps">
            <h3 style="margin-top: 0;">IMMEDIATE ACTIONS:</h3>
            <ol style="font-size: 16px; line-height: 1.8;">
              <li><strong>Call ${userName} immediately</strong> - Try all known phone numbers</li>
              <li><strong>Text ${userName}</strong> - Ask for confirmation of safety</li>
              <li><strong>Check last known location</strong> (see below)</li>
              <li><strong>Contact other emergency contacts</strong> to coordinate response</li>
              <li><strong>If no response within 30 minutes:</strong> Consider contacting local authorities</li>
            </ol>
          </div>

          <div class="location">
            <h3 style="margin-top: 0;">📍 LAST KNOWN LOCATION</h3>
            <p style="font-size: 16px; margin: 5px 0;"><strong>${locationStr}</strong></p>
            <p style="font-size: 14px; color: #666; margin: 5px 0;">Time: ${new Date().toLocaleString()}</p>
          </div>

          <p><strong>SESSION DETAILS:</strong></p>
          <ul style="font-size: 15px;">
            <li>Protection Level: ${session?.protectionLevel || 'Unknown'}</li>
            <li>Destination: ${session?.destination || 'Not specified'}</li>
            <li>Started: ${session?.startedAt ? new Date(session.startedAt.toMillis?.() || session.startedAt).toLocaleString() : 'Unknown'}</li>
            <li>Notes: ${session?.notes || 'None'}</li>
          </ul>

          <div class="info-box" style="background: #7F1D1D; color: white; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">IF ${userName.toUpperCase()} IS IN IMMEDIATE DANGER</p>
            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">CALL 911 NOW</p>
          </div>

          <p style="margin-top: 30px; font-size: 13px; color: #666; border-top: 2px solid #ddd; padding-top: 20px;">
            You are receiving this emergency alert because ${userName} listed you as an emergency contact in ChainAlert. 
            This is an automated system designed to protect individuals during interactions with immigration enforcement or other high-risk situations.
          </p>
          
          <p style="font-size: 13px; color: #666;">
            <strong>Emergency Services:</strong> 911<br>
            <strong>ICE Detainee Hotline:</strong> 1-888-351-4024<br>
            <strong>ACLU Immigrants' Rights:</strong> 1-877-336-8800
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
          subject: `🚨🚨 EMERGENCY: ${userName} needs immediate help`
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
    console.error(`SendGrid API error (${response.status}):`, error);
    console.error('Request was:', {
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@chainalert.com',
      to: email,
      subject: `🚨🚨 EMERGENCY: ${userName} needs immediate help`
    });
    throw new Error(`Failed to send emergency contact email: ${error}`);
  }

  return { id: 'sent' };
}

/**
 * Send emergency email to legal organization
 */
async function sendLegalEmergencyEmail(
  apiKey: string,
  email: string,
  contactName: string,
  organization: string,
  userName: string,
  userEmail: string,
  session: any | null | undefined,
  location: any
): Promise<any> {
  // Handle null/undefined session
  if (!session) {
    session = {};
  }
  
  console.log('📧 sendLegalEmergencyEmail called with location:', location);
  const locationStr = formatLocation(location);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #1E40AF; color: white; padding: 25px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; border: 3px solid #1E40AF; border-top: none; background: white; border-radius: 0 0 8px 8px; }
        .case-info { background: #FEE2E2; padding: 20px; border-left: 4px solid #DC2626; margin: 20px 0; }
        .data-section { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚨 URGENT LEGAL NOTIFICATION</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">${organization}</p>
        </div>
        <div class="content">
          <p>Dear ${contactName},</p>

          <div class="case-info">
            <h3 style="margin-top: 0;">EMERGENCY ALERT ACTIVATED</h3>
            <p style="margin: 0;"><strong>Individual Name:</strong> ${userName}</p>
            <p style="margin: 5px 0;"><strong>Contact Email:</strong> ${userEmail}</p>
            <p style="margin: 5px 0;"><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p>One of your protected individuals has activated an emergency alert through ChainAlert's safety system. 
          This indicates they may be in immediate danger or have been detained.</p>

          <div class="data-section">
            <h3 style="margin-top: 0;">CASE INFORMATION</h3>
            <p><strong>Last Known Location:</strong><br>${locationStr}</p>
            <p><strong>Session Type:</strong> ${session?.protectionLevel || 'Unknown'}</p>
            <p><strong>Intended Destination:</strong> ${session?.destination || 'Not specified'}</p>
            <p><strong>Session Started:</strong> ${session?.startedAt ? new Date(session.startedAt.toMillis?.() || session.startedAt).toLocaleString() : 'Unknown'}</p>
            <p><strong>Emergency Triggered:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="data-section">
            <h3 style="margin-top: 0;">AVAILABLE DOCUMENTATION</h3>
            <ul>
              <li>Signed consent forms (on file in ChainAlert system)</li>
              <li>Complete session audit trail</li>
              <li>GPS location tracking data</li>
              <li>Emergency contact list</li>
              <li>Timeline of check-ins and alerts</li>
            </ul>
            <p><em>All documentation can be accessed through your ChainAlert legal portal or requested via legal@chainalert.app</em></p>
          </div>

          <p><strong>RECOMMENDED ACTIONS:</strong></p>
          <ol>
            <li>Attempt to contact ${userName} at ${userEmail}</li>
            <li>Coordinate with emergency contacts (also notified)</li>
            <li>Prepare case documentation if legal intervention is needed</li>
            <li>Monitor situation for updates from ChainAlert system</li>
          </ol>

          <p style="padding: 15px; background: #FEF3C7; border-left: 4px solid #EAB308; margin: 20px 0;">
            <strong>⚠️ IMPORTANT:</strong> This individual has provided explicit consent for your organization 
            to be notified in emergency situations. All actions are pursuant to signed authorization.
          </p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 13px; color: #666;">
            <strong>ChainAlert Legal Notification System</strong><br>
            For technical support or case documentation requests: legal@chainalert.app<br>
            Emergency hotlines: ICE Detainee Hotline (1-888-351-4024), ACLU (1-877-336-8800)
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
          subject: `🚨 LEGAL ALERT: ${userName} - ChainAlert Emergency Case File`
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
    console.error(`SendGrid API error (${response.status}):`, error);
    console.error('Request was:', {
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@chainalert.com',
      to: email,
      subject: `🚨 LEGAL ALERT: ${userName} - ChainAlert Emergency Case File`
    });
    throw new Error(`Failed to send legal emergency email: ${error}`);
  }

  return { id: 'sent' };
}

/**
 * Format location for display
 */
function formatLocation(location: any): string {
  if (!location) {
    console.warn('📍 Location is undefined/null in formatLocation');
    return 'Location unavailable';
  }

  console.log('📍 Formatting location:', {
    hasAddress: !!location.address,
    hasLat: !!location.lat,
    hasLng: !!location.lng,
    keys: Object.keys(location),
    location
  });

  const parts = [];
  
  // Handle address - could be string or object
  if (location.address) {
    if (typeof location.address === 'string') {
      parts.push(location.address);
    } else if (typeof location.address === 'object' && location.address.fullAddress) {
      parts.push(location.address.fullAddress);
    }
  }
  
  // Handle coordinates - could be lat/lng or latitude/longitude
  const lat = location.lat || location.latitude;
  const lng = location.lng || location.longitude;
  if (lat && lng) {
    parts.push(`GPS: ${(+lat).toFixed(6)}, ${(+lng).toFixed(6)}`);
  }

  const result = parts.length > 0 ? parts.join('\n') : 'Location unavailable';
  console.log('📍 Formatted location result:', result);
  return result;
}
