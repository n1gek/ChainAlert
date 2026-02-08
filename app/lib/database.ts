// lib/database.ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  addDoc,
  DocumentReference,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  UserProfile,
  EmergencyContact,
  UserPreferences,
  Session,
  CheckIn,
  SessionStats,
  ConsentRecord,
  DocumentMetadata,
  AuditLog,
  Notification,
  Escalation,
  EscalationStage,
  Jurisdiction,
  EscalationConfig,
  ConsentTemplate,
  ProtectionLevel
} from './types';

// ==================== USER OPERATIONS ====================
export const userDB = {
  // Create or update user profile
  async upsertUserProfile(userId: string, data: Partial<UserProfile>) {
    const userRef = doc(db, 'users', userId);
    const userData: UserProfile = {
      uid: userId,
      email: data.email || '',
      displayName: data.displayName || '',
      fullName: data.fullName || '',
      phoneNumber: data.phoneNumber || '',
      photoURL: data.photoURL || '',
      emergencyContacts: data.emergencyContacts || [],
      preferences: data.preferences || {
        notificationPreferences: {
          email: true,
          push: true,
          sms: false
        },
        defaultProtectionLevel: 'work',
        escalationConfigId: '',
        jurisdiction: 'CA'
      },
      settings: data.settings || {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: 'en',
        theme: 'light'
      },
      stats: data.stats || {
        totalSessions: 0,
        totalCheckIns: 0,
        successfulEscalations: 0,
        avgResponseTime: 0
      },
      createdAt: data.createdAt || serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };
    
    await setDoc(userRef, userData, { merge: true });
    return userData;
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as UserProfile : null;
  },

  // Update emergency contacts
  async updateEmergencyContacts(userId: string, contacts: EmergencyContact[]) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      emergencyContacts: contacts,
      updatedAt: serverTimestamp()
    });
  },

  // Add single emergency contact
  async addEmergencyContact(userId: string, contact: EmergencyContact) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const user = userSnap.data() as UserProfile;
      const contacts = [...(user.emergencyContacts || []), contact];
      await updateDoc(userRef, {
        emergencyContacts: contacts,
        updatedAt: serverTimestamp()
      });
    }
  },

  // Update user preferences
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      preferences: preferences,
      updatedAt: serverTimestamp()
    });
  }
};

// ==================== SESSION OPERATIONS ====================
export const sessionDB = {
  // Start a new protection session
  async startSession(userId: string, sessionData: {
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
  }): Promise<string> {
    const sessionId = `${userId}_${Date.now()}`;
    const sessionRef = doc(db, 'sessions', sessionId);
    
    const now = Timestamp.now();
    
    // Build readable address string from address object
    let addressString = 'Location unavailable';
    if (sessionData.location?.address) {
      const addr = sessionData.location.address;
      const parts = [
        addr.neighbourhood || addr.suburb,
        addr.city || addr.town || addr.village,
        addr.state,
        addr.country
      ].filter(Boolean);
      addressString = parts.length > 0 ? parts.join(', ') : addr.fullAddress || addressString;
    }
    
    const session: Session = {
      sessionId,
      userId,
      status: 'active',
      protectionLevel: sessionData.protectionLevel,
      destination: sessionData.destination || '',
      notes: sessionData.notes || '',
      checkInIntervalMinutes: sessionData.checkInIntervalMinutes,
      durationMinutes: sessionData.durationMinutes,
      startedAt: now,
      nextCheckInDue: Timestamp.fromMillis(now.toMillis() + (sessionData.checkInIntervalMinutes * 60 * 1000)),
      endTime: Timestamp.fromMillis(now.toMillis() + (sessionData.durationMinutes * 60 * 1000)),
      checkIns: [],
      stats: {
        totalCheckIns: 0,
        averageResponseTime: 0,
        missedCheckIns: 0,
        lastCheckInAt: now
      },
      location: {
        lat: sessionData.location?.latitude || 0,
        lng: sessionData.location?.longitude || 0,
        address: addressString,
        timestamp: now,
        // Store extended address data, filtering out undefined values
        ...(sessionData.location?.address && {
          addressData: Object.fromEntries(
            Object.entries(sessionData.location.address).filter(([_, v]) => v !== undefined)
          )
        }),
        ...(sessionData.location?.accuracy && {
          accuracy: sessionData.location.accuracy
        })
      } as any,
      createdAt: now,
      updatedAt: now
    };
    
    await setDoc(sessionRef, session);
    
    // Log the session start
    await auditLogDB.create({
      userId,
      action: 'session_started',
      resourceType: 'session',
      resourceId: sessionId,
      details: {
        protectionLevel: sessionData.protectionLevel,
        duration: sessionData.durationMinutes,
        location: sessionData.location ? {
          latitude: sessionData.location.latitude,
          longitude: sessionData.location.longitude,
          address: sessionData.location.address ? Object.fromEntries(
            Object.entries(sessionData.location.address).filter(([_, v]) => v !== undefined)
          ) : undefined
        } : null
      },
      ipAddress: '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
    });
    
    return sessionId;
  },

  // Record a check-in
  async recordCheckIn(sessionId: string, checkInData: Partial<Omit<CheckIn, 'location'>> & {
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
  } = {}) {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) throw new Error('Session not found');
    
    const session = sessionSnap.data() as Session;
    const now = Timestamp.now();
    const responseTime = now.toMillis() - (session.nextCheckInDue?.toMillis() || now.toMillis());
    
    // Build location object in storage format
    let locationForStorage = session.location; // Default to session location
    if (checkInData.location) {
      const addr = checkInData.location.address;
      let addressString = 'Location unavailable';
      if (addr) {
        const parts = [
          addr.neighbourhood || addr.suburb,
          addr.city || addr.town || addr.village,
          addr.state,
          addr.country
        ].filter(Boolean);
        addressString = parts.length > 0 ? parts.join(', ') : addr.fullAddress || addressString;
      }
      
      locationForStorage = {
        lat: checkInData.location.latitude,
        lng: checkInData.location.longitude,
        address: addressString,
        timestamp: now,
        ...(addr && { addressData: Object.fromEntries(
          Object.entries(addr).filter(([_, v]) => v !== undefined)
        ) }),
        ...(checkInData.location.accuracy && { accuracy: checkInData.location.accuracy })
      } as any;
    }
    
    const checkIn: CheckIn = {
      checkInId: `${sessionId}_${Date.now()}`,
      sessionId,
      timestamp: now,
      location: locationForStorage,
      method: checkInData.method || 'manual',
      verification: checkInData.verification || 'none',
      notes: checkInData.notes || '',
      responseTime: Math.max(0, responseTime / 1000) // in seconds
    };
    
    const updatedCheckIns = [...session.checkIns, checkIn];
    const nextCheckIn = Timestamp.fromMillis(now.toMillis() + (session.checkInIntervalMinutes * 60 * 1000));
    
    await updateDoc(sessionRef, {
      checkIns: updatedCheckIns,
      nextCheckInDue: nextCheckIn,
      'stats.totalCheckIns': session.stats.totalCheckIns + 1,
      'stats.lastCheckInAt': now,
      'stats.averageResponseTime': calculateNewAverage(
        session.stats.averageResponseTime,
        session.stats.totalCheckIns,
        checkIn.responseTime
      ),
      updatedAt: now
    });
    
    // Log the check-in
    await auditLogDB.create({
      userId: session.userId,
      action: 'check_in',
      resourceType: 'session',
      resourceId: sessionId,
      details: {
        method: checkIn.method,
        responseTime: checkIn.responseTime
      },
      ipAddress: '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
    });
    
    return checkIn;
  },

  // Get active sessions for a user
  async getActiveSessions(userId: string): Promise<Session[]> {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => doc.data() as Session);
    // Sort by nextCheckInDue client-side
    return sessions.sort((a, b) => a.nextCheckInDue.seconds - b.nextCheckInDue.seconds);
  },

  // End a session
  async endSession(sessionId: string, reason: 'completed' | 'cancelled' | 'emergency' = 'completed') {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        console.warn(`Session ${sessionId} not found in database - may have already been ended or never created`);
        return; // Return gracefully instead of throwing
      }
      
      const session = sessionSnap.data() as Session;
      const now = Timestamp.now();
      
      await updateDoc(sessionRef, {
        status: reason,
        endedAt: now,
        updatedAt: now
      });
      
      // Log the session end
      await auditLogDB.create({
        userId: session.userId,
        action: 'session_ended',
        resourceType: 'session',
        resourceId: sessionId,
        details: { reason },
        ipAddress: '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
      });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Get session by ID
  async getSession(sessionId: string): Promise<Session | null> {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    return sessionSnap.exists() ? sessionSnap.data() as Session : null;
  }
};

// ==================== CONSENT OPERATIONS ====================
export const consentDB = {
  // Record user consent
  async recordConsent(userId: string, templateId: string, version: string): Promise<string> {
    const consentId = `${userId}_${Date.now()}`;
    const consentRef = doc(db, 'consents', consentId);
    
    const consent: ConsentRecord = {
      consentId,
      userId,
      templateId,
      version,
      grantedAt: Timestamp.now(),
      method: 'digital_signature',
      ipAddress: '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      isActive: true,
      revokedAt: null,
      revocationReason: null
    };
    
    await setDoc(consentRef, consent);
    
    // Update user preferences
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.hasGivenConsent': true,
      updatedAt: serverTimestamp()
    });
    
    return consentId;
  },

  // Get user's active consent
  async getActiveConsent(userId: string): Promise<ConsentRecord | null> {
    const consentsRef = collection(db, 'consents');
    const q = query(
      consentsRef,
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    // Filter for active consents and sort by grantedAt on client side to avoid index requirements
    const consents = snapshot.docs
      .map(doc => doc.data() as ConsentRecord)
      .filter(c => c.isActive === true)
      .sort((a, b) => {
        const aTime = a.grantedAt?.seconds || 0;
        const bTime = b.grantedAt?.seconds || 0;
        return bTime - aTime; // desc
      });
    
    return consents.length > 0 ? consents[0] : null;
  },

  // Revoke consent
  async revokeConsent(consentId: string, reason: string) {
    const consentRef = doc(db, 'consents', consentId);
    await updateDoc(consentRef, {
      isActive: false,
      revokedAt: Timestamp.now(),
      revocationReason: reason
    });
  },

  // Get consent template
  async getConsentTemplate(templateId: string): Promise<ConsentTemplate | null> {
    const templateRef = doc(db, 'consentTemplates', templateId);
    const templateSnap = await getDoc(templateRef);
    return templateSnap.exists() ? templateSnap.data() as ConsentTemplate : null;
  }
};

// ==================== DOCUMENT OPERATIONS ====================
export const documentDB = {
  // Add document metadata
  async addDocument(userId: string, documentData: Omit<DocumentMetadata, 'documentId' | 'userId' | 'uploadedAt'>): Promise<string> {
    const documentId = `${userId}_${Date.now()}`;
    const documentRef = doc(db, 'documents', documentId);
    
    const document: DocumentMetadata = {
      documentId,
      userId,
      name: documentData.name,
      type: documentData.type,
      category: documentData.category,
      size: documentData.size,
      storagePath: documentData.storagePath,
      mimeType: documentData.mimeType,
      accessLevel: documentData.accessLevel,
      isEncrypted: documentData.isEncrypted,
      description: documentData.description || '',
      tags: documentData.tags || [],
      status: 'pending',
      uploadedAt: Timestamp.now(),
      verifiedAt: null,
      expirationDate: documentData.expirationDate || null
    };
    
    await setDoc(documentRef, document);
    
    // Log document upload
    await auditLogDB.create({
      userId,
      action: 'document_uploaded',
      resourceType: 'document',
      resourceId: documentId,
      details: {
        type: documentData.type,
        category: documentData.category
      },
      ipAddress: '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
    });
    
    return documentId;
  },

  // Get user documents
  async getUserDocuments(userId: string, type?: string): Promise<DocumentMetadata[]> {
    const documentsRef = collection(db, 'documents');
    const conditions = [where('userId', '==', userId)];
    if (type) conditions.push(where('type', '==', type));
    
    // TEMPORARY: Removed orderBy until Firestore index is built
    // Once index is ready, restore: orderBy('uploadedAt', 'desc')
    const q = query(documentsRef, ...conditions);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => doc.data() as DocumentMetadata);
    
    // Sort client-side as temporary workaround
    return docs.sort((a, b) => {
      const aTime = a.uploadedAt?.seconds || 0;
      const bTime = b.uploadedAt?.seconds || 0;
      return bTime - aTime; // Descending order (newest first)
    });
  },

  // Delete document
  async deleteDocument(documentId: string) {
    const documentRef = doc(db, 'documents', documentId);
    const documentSnap = await getDoc(documentRef);
    
    if (documentSnap.exists()) {
      const document = documentSnap.data() as DocumentMetadata;
      
      // Log deletion
      await auditLogDB.create({
        userId: document.userId,
        action: 'document_deleted',
        resourceType: 'document',
        resourceId: documentId,
        details: {},
        ipAddress: '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
      });
      
      await deleteDoc(documentRef);
    }
  }
};

// ==================== ESCALATION OPERATIONS ====================
export const escalationDB = {
  // Trigger an escalation
  async triggerEscalation(sessionId: string, reason: 'missed_checkin' | 'emergency_button' | 'manual'): Promise<string> {
    const session = await sessionDB.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    
    const escalationId = `${sessionId}_${Date.now()}`;
    const escalationRef = doc(db, 'escalations', escalationId);
    
    const escalation: Escalation = {
      escalationId,
      sessionId,
      userId: session.userId,
      reason,
      status: 'pending',
      triggeredAt: Timestamp.now(),
      stages: [
        {
          stage: 1,
          name: 'Contact Notification',
          status: 'pending',
          scheduledFor: Timestamp.now(),
          completedAt: null
        },
        {
          stage: 2,
          name: 'Legal Organization Alert',
          status: 'pending',
          scheduledFor: Timestamp.fromMillis(Timestamp.now().toMillis() + (45 * 60 * 1000)), // 45 minutes later
          completedAt: null
        },
        {
          stage: 3,
          name: 'National Hotline',
          status: 'pending',
          scheduledFor: Timestamp.fromMillis(Timestamp.now().toMillis() + (75 * 60 * 1000)), // 75 minutes later
          completedAt: null
        }
      ],
      notifications: [],
      completedAt: null
    };
    
    await setDoc(escalationRef, escalation);
    
    // Log the escalation
    await auditLogDB.create({
      userId: session.userId,
      action: 'escalation_triggered',
      resourceType: 'escalation',
      resourceId: escalationId,
      details: { reason },
      ipAddress: '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
    });
    
    return escalationId;
  },

  // Get active escalations for a user
  async getActiveEscalations(userId: string): Promise<Escalation[]> {
    const escalationsRef = collection(db, 'escalations');
    const q = query(
      escalationsRef,
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('triggeredAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Escalation);
  },

  // Update escalation stage
  async updateEscalationStage(escalationId: string, stageNumber: number, status: 'completed' | 'failed', details?: any) {
    const escalationRef = doc(db, 'escalations', escalationId);
    const escalationSnap = await getDoc(escalationRef);
    
    if (!escalationSnap.exists()) throw new Error('Escalation not found');
    
    const escalation = escalationSnap.data() as Escalation;
    const updatedStages = escalation.stages.map((stage: EscalationStage) => 
      stage.stage === stageNumber 
        ? { ...stage, status, completedAt: Timestamp.now() }
        : stage
    );
    
    const allCompleted = updatedStages.every((s: EscalationStage) => s.status === 'completed');
    
    await updateDoc(escalationRef, {
      stages: updatedStages,
      status: allCompleted ? 'completed' : 'in_progress',
      completedAt: allCompleted ? Timestamp.now() : null,
      updatedAt: Timestamp.now()
    });
    
    // Log stage update
    await auditLogDB.create({
      userId: escalation.userId,
      action: 'escalation_stage_updated',
      resourceType: 'escalation',
      resourceId: escalationId,
      details: { stage: stageNumber, status, ...details },
      ipAddress: '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : ''
    });
  }
};

// ==================== JURISDICTION OPERATIONS ====================
export const jurisdictionDB = {
  // Get jurisdiction by state code
  async getJurisdiction(stateCode: string): Promise<Jurisdiction | null> {
    const jurisdictionRef = doc(db, 'jurisdictions', stateCode.toUpperCase());
    const jurisdictionSnap = await getDoc(jurisdictionRef);
    return jurisdictionSnap.exists() ? jurisdictionSnap.data() as Jurisdiction : null;
  },

  // Get all jurisdictions
  async getAllJurisdictions(): Promise<Jurisdiction[]> {
    const jurisdictionsRef = collection(db, 'jurisdictions');
    const q = query(jurisdictionsRef, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Jurisdiction);
  },

  // Update user jurisdiction
  async updateUserJurisdiction(userId: string, stateCode: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.jurisdiction': stateCode.toUpperCase(),
      updatedAt: serverTimestamp()
    });
  }
};

// ==================== NOTIFICATION OPERATIONS ====================
export const notificationDB = {
  // Create notification
  async createNotification(userId: string, notificationData: Omit<Notification, 'notificationId' | 'userId' | 'createdAt' | 'readAt'>): Promise<string> {
    const notificationId = `${userId}_${Date.now()}`;
    const notificationRef = doc(db, 'notifications', notificationId);
    
    const notification: Notification = {
      notificationId,
      userId,
      type: notificationData.type,
      title: notificationData.title,
      body: notificationData.body,
      priority: notificationData.priority,
      channel: notificationData.channel,
      data: notificationData.data || {},
      status: 'pending',
      scheduledFor: notificationData.scheduledFor || Timestamp.now(),
      createdAt: Timestamp.now(),
      sentAt: null,
      readAt: null
    };
    
    await setDoc(notificationRef, notification);
    return notificationId;
  },

  // Get user notifications
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const notificationsRef = collection(db, 'notifications');
    const conditions = [where('userId', '==', userId)];
    if (unreadOnly) conditions.push(where('readAt', '==', null));
    
    const q = query(notificationsRef, ...conditions, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Notification);
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      readAt: Timestamp.now(),
      status: 'read'
    });
  }
};

// ==================== AUDIT LOG OPERATIONS ====================
export const auditLogDB = {
  // Create audit log
  async create(logData: Omit<AuditLog, 'logId' | 'timestamp'>): Promise<string> {
    const logId = `${logData.userId}_${Date.now()}`;
    const logRef = doc(db, 'auditLogs', logId);
    
    const log: AuditLog = {
      logId,
      userId: logData.userId,
      action: logData.action,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId,
      details: logData.details || {},
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent,
      timestamp: Timestamp.now()
    };
    
    await setDoc(logRef, log);
    return logId;
  },

  // Get user audit logs
  async getUserAuditLogs(userId: string, limitCount: number = 100): Promise<AuditLog[]> {
    const logsRef = collection(db, 'auditLogs');
    const q = query(
      logsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
  }
};

// ==================== HELPER FUNCTIONS ====================
function calculateNewAverage(currentAverage: number, count: number, newValue: number): number {
  return ((currentAverage * count) + newValue) / (count + 1);
}

// ==================== REAL-TIME LISTENERS ====================
export function subscribeToActiveSessions(userId: string, callback: (sessions: Session[]) => void) {
  // Note: For real-time, you would use onSnapshot
  // This is a placeholder - implement with Firestore real-time listeners
  console.log('Real-time subscription not implemented yet');
  return () => {}; // Cleanup function
}

// ==================== EXPORT ALL OPERATIONS ====================
export default {
  user: userDB,
  session: sessionDB,
  consent: consentDB,
  document: documentDB,
  escalation: escalationDB,
  jurisdiction: jurisdictionDB,
  notification: notificationDB,
  auditLog: auditLogDB
};