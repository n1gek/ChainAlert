// Contacts API Route
import { NextRequest, NextResponse } from 'next/server';
import { userDB } from '@/app/lib/database';

export const dynamic = 'force-dynamic';

interface ContactRequest {
  contactId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  relationship: string;
  isLegal: boolean;
  organization?: string;
  barNumber?: string;
  specialization?: string;
  notifyVia?: ('sms' | 'email' | 'call')[];
}

// GET - Fetch user's contacts
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

    const userProfile = await userDB.getUserProfile(userId);
    
    // Return empty array if user profile doesn't exist yet
    if (!userProfile) {
      return NextResponse.json({ 
        contacts: [] 
      });
    }

    return NextResponse.json({ 
      contacts: userProfile.emergencyContacts || [] 
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Add or update contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contact } = body as { userId: string; contact: ContactRequest };

    if (!userId || !contact) {
      return NextResponse.json(
        { error: 'User ID and contact data are required' },
        { status: 400 }
      );
    }

    // Get current contacts
    let userProfile = await userDB.getUserProfile(userId);
    
    // Create user profile if it doesn't exist
    if (!userProfile) {
      await userDB.upsertUserProfile(userId, {
        emergencyContacts: []
      });
      userProfile = await userDB.getUserProfile(userId);
    }

    const existingContacts = userProfile?.emergencyContacts || [];

    // Transform contact to match EmergencyContact type
    const emergencyContact = {
      contactId: contact.contactId || `contact_${Date.now()}`,
      name: `${contact.firstName} ${contact.lastName}`,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      priority: 1, // Default priority for all contacts
      notifyVia: contact.notifyVia || ['sms', 'email'] as ('sms' | 'email' | 'call')[],
      isActive: true,
      // Store additional fields in a metadata object (extended data)
      metadata: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        isLegal: contact.isLegal,
        organization: contact.organization,
        barNumber: contact.barNumber,
        specialization: contact.specialization
      }
    };

    let updatedContacts;

    if (contact.contactId) {
      // Update existing contact
      updatedContacts = existingContacts.map((c: any) => 
        c.contactId === contact.contactId ? emergencyContact : c
      );
    } else {
      // Add new contact
      updatedContacts = [...existingContacts, emergencyContact];
    }

    // Update in database
    await userDB.updateEmergencyContacts(userId, updatedContacts);

    return NextResponse.json({
      success: true,
      contact: emergencyContact,
      message: contact.contactId ? 'Contact updated successfully' : 'Contact added successfully'
    });
  } catch (error) {
    console.error('Error saving contact:', error);
    return NextResponse.json(
      { error: 'Failed to save contact', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Delete contact
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const contactId = searchParams.get('contactId');

    if (!userId || !contactId) {
      return NextResponse.json(
        { error: 'User ID and contact ID are required' },
        { status: 400 }
      );
    }

    // Get current contacts
    const userProfile = await userDB.getUserProfile(userId);
    
    // If no profile exists, nothing to delete
    if (!userProfile) {
      return NextResponse.json({
        success: true,
        message: 'Contact deleted successfully'
      });
    }

    // Remove contact
    const updatedContacts = (userProfile.emergencyContacts || []).filter(
      (c: any) => c.contactId !== contactId
    );

    // Update in database
    await userDB.updateEmergencyContacts(userId, updatedContacts);

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact', details: (error as Error).message },
      { status: 500 }
    );
  }
}
