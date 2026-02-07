// Consent API Route
import { NextRequest, NextResponse } from 'next/server';
import { consentDB, userDB } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

interface ConsentRequest {
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  templateId?: string;
  version: string;
  ipAddress?: string;
}

// GET - Check if user has active consent
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

    const activeConsent = await consentDB.getActiveConsent(userId);
    const userProfile = await userDB.getUserProfile(userId);
    
    return NextResponse.json({ 
      hasConsent: !!activeConsent,
      consent: activeConsent,
      userProfile: userProfile
    });
  } catch (error) {
    console.error('Error fetching consent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Record user consent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, userEmail, userPhone, templateId, version, ipAddress } = body as ConsentRequest;

    if (!userId || !userName || !version) {
      return NextResponse.json(
        { error: 'User ID, name, and version are required' },
        { status: 400 }
      );
    }

    // Create or update user profile with consent info
    await userDB.upsertUserProfile(userId, {
      fullName: userName,
      email: userEmail || '',
      phoneNumber: userPhone || '',
      preferences: {
        hasGivenConsent: true,
        notificationPreferences: {
          email: true,
          push: true,
          sms: true
        },
        defaultProtectionLevel: 'custom',
        escalationConfigId: 'default',
        jurisdiction: 'US'
      }
    });

    // Record consent
    const consentId = await consentDB.recordConsent(
      userId, 
      templateId || 'default_template',
      version
    );

    return NextResponse.json({
      success: true,
      consentId,
      message: 'Consent recorded successfully'
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record consent', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Revoke consent
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get active consent
    const activeConsent = await consentDB.getActiveConsent(userId);
    
    if (activeConsent) {
      // Revoke the consent
      await consentDB.revokeConsent(activeConsent.consentId, 'User requested revocation');
      
      // Update user preferences
      await userDB.upsertUserProfile(userId, {
        preferences: {
          hasGivenConsent: false,
          notificationPreferences: {
            email: true,
            push: true,
            sms: false
          },
          defaultProtectionLevel: 'work',
          escalationConfigId: '',
          jurisdiction: 'CA'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Consent revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking consent:', error);
    return NextResponse.json(
      { error: 'Failed to revoke consent', details: (error as Error).message },
      { status: 500 }
    );
  }
}
