// Type definitions for database operations
import { Timestamp } from 'firebase/firestore';


export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  fullName?: string;
  phoneNumber?: string;
  photoURL: string;
  emergencyContacts: EmergencyContact[];
  preferences: UserPreferences;
  settings: UserSettings;
  stats: UserStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type EmergencyContact = {
  contactId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority: number;
  notifyVia: ('sms' | 'email' | 'call')[];
  isActive: boolean;
  metadata?: {
    firstName?: string;
    lastName?: string;
    isLegal?: boolean;
    organization?: string;
    barNumber?: string;
    specialization?: string;
  };
};

export type UserPreferences = {
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  defaultProtectionLevel: ProtectionLevel;
  escalationConfigId: string;
  jurisdiction: string;
  hasGivenConsent?: boolean;
};

export type UserSettings = {
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
};

export type UserStats = {
  totalSessions: number;
  totalCheckIns: number;
  successfulEscalations: number;
  avgResponseTime: number;
};


export type ProtectionLevel = 
  | 'short' 
  | 'work' 
  | 'overnight' 
  | 'highrisk' 
  | 'custom'
  | 'short_trip';

export type Session = {
  sessionId: string;
  userId: string;
  status: 'active' | 'completed' | 'cancelled' | 'emergency' | 'escalated';
  protectionLevel: ProtectionLevel;
  destination: string;
  notes: string;
  checkInIntervalMinutes: number;
  durationMinutes: number;
  startedAt: Timestamp;
  nextCheckInDue: Timestamp;
  endTime: Timestamp;
  endedAt?: Timestamp;
  checkIns: CheckIn[];
  stats: SessionStats;
  location: LocationData;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CheckIn = {
  checkInId: string;
  sessionId: string;
  timestamp: Timestamp;
  location: LocationData;
  method: 'manual' | 'automatic' | 'geofence';
  verification: 'none' | 'biometric' | 'code';
  notes: string;
  responseTime: number; // in seconds
};

export type SessionStats = {
  totalCheckIns: number;
  averageResponseTime: number;
  missedCheckIns: number;
  lastCheckInAt: Timestamp;
};

export type LocationData = {
  lat: number;
  lng: number;
  address: string;
  timestamp: Timestamp;
};


export type ConsentRecord = {
  consentId: string;
  userId: string;
  templateId: string;
  version: string;
  grantedAt: Timestamp;
  method: 'digital_signature' | 'voice' | 'written';
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  revokedAt: Timestamp | null;
  revocationReason: string | null;
};

export type ConsentTemplate = {
  templateId: string;
  version: string;
  type: 'terms' | 'privacy' | 'data_sharing' | 'emergency_contact';
  content: string;
  effectiveDate: Timestamp;
  expirationDate: Timestamp | null;
  isActive: boolean;
};


export type DocumentMetadata = {
  documentId: string;
  userId: string;
  name: string;
  type: 'id' | 'evidence' | 'legal' | 'medical' | 'other';
  category: string;
  size: number;
  storagePath: string;
  mimeType: string;
  accessLevel: 'private' | 'shared' | 'public';
  isEncrypted: boolean;
  description: string;
  tags: string[];
  status: 'pending' | 'verified' | 'rejected';
  uploadedAt: Timestamp;
  verifiedAt: Timestamp | null;
  expirationDate: Timestamp | null;
};


export type Escalation = {
  escalationId: string;
  sessionId: string;
  userId: string;
  reason: 'missed_checkin' | 'emergency_button' | 'manual';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  triggeredAt: Timestamp;
  stages: EscalationStage[];
  notifications: NotificationRecord[];
  completedAt: Timestamp | null;
  updatedAt?: Timestamp;
};

export type EscalationStage = {
  stage: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  scheduledFor: Timestamp;
  completedAt: Timestamp | null;
};

export type EscalationConfig = {
  configId: string;
  userId: string;
  stage1: StageConfig;
  stage2: StageConfig;
  stage3: StageConfig;
  isActive: boolean;
  updatedAt: Timestamp;
};

export type StageConfig = {
  delayMinutes: number;
  contacts: string[];
  methods: ('sms' | 'email' | 'call')[];
  message?: string;
};


export type Notification = {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channel: ('push' | 'email' | 'sms' | 'in_app')[];
  data: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledFor: Timestamp;
  createdAt: Timestamp;
  sentAt: Timestamp | null;
  readAt: Timestamp | null;
};

export type NotificationType =
  | 'check_in_reminder'
  | 'session_started'
  | 'session_ended'
  | 'escalation_triggered'
  | 'escalation_stage_completed'
  | 'emergency_contact_added'
  | 'document_uploaded'
  | 'consent_required'
  | 'system_notification';

export type NotificationRecord = {
  notificationId: string;
  timestamp: Timestamp;
  recipient: string;
  method: 'sms' | 'email' | 'call' | 'push';
  status: 'sent' | 'delivered' | 'failed';
  error?: string;
};


export type Jurisdiction = {
  stateCode: string;
  name: string;
  hotline: string;
  hotline247: boolean;
  legalOrganizations: LegalOrganization[];
  resources: Resource[];
  updatedAt: Timestamp;
};

export type LegalOrganization = {
  name: string;
  phone: string;
  email?: string;
  website?: string;
  address?: string;
  services: string[];
};

export type Resource = {
  type: 'shelter' | 'legal_aid' | 'counseling' | 'hotline' | 'other';
  name: string;
  contact: string;
  description?: string;
  availability?: string;
};


export type AuditLog = {
  logId: string;
  userId: string;
  action: string;
  resourceType: 'session' | 'user' | 'document' | 'consent' | 'escalation' | 'notification';
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Timestamp;
};
