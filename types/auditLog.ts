// Audit Log Type - Comprehensive activity tracking for compliance
export type AuditLog = {
  id: string;
  
  // Actor Information
  userId?: string; // Who performed the action (null for system actions)
  userEmail?: string;
  actorType: 'user' | 'system' | 'admin' | 'function';
  
  // Action Details
  action: AuditAction;
  resource: string; // e.g., 'session', 'user', 'consent', 'document'
  resourceId?: string; // ID of the affected resource
  
  // Context
  description: string;
  metadata?: Record<string, any>; // Additional context data
  
  // Result
  status: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  
  // Request Information
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  
  // Compliance
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresReview: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  
  // Location (if applicable)
  location?: {
    latitude: number;
    longitude: number;
    state?: string;
  };
  
  // Timestamp
  timestamp: string; // ISO timestamp
  createdAt: string;
};

// Audit Action Types
export type AuditAction =
  // Authentication
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_reset'
  | 'user.email_verified'
  
  // Session Actions
  | 'session.started'
  | 'session.completed'
  | 'session.cancelled'
  | 'session.check_in'
  | 'session.missed_check_in'
  | 'session.escalation_triggered'
  | 'session.escalation_resolved'
  
  // Consent Actions
  | 'consent.accepted'
  | 'consent.revoked'
  | 'consent.updated'
  
  // Contact Actions
  | 'emergency_contact.added'
  | 'emergency_contact.updated'
  | 'emergency_contact.removed'
  | 'emergency_contact.notified'
  
  // Document Actions
  | 'document.uploaded'
  | 'document.viewed'
  | 'document.shared'
  | 'document.deleted'
  | 'document.downloaded'
  
  // Profile Actions
  | 'profile.updated'
  | 'profile.deleted'
  | 'settings.updated'
  
  // Escalation Actions
  | 'escalation.sms_sent'
  | 'escalation.email_sent'
  | 'escalation.call_initiated'
  | 'escalation.authorities_notified'
  
  // System Actions
  | 'system.backup_created'
  | 'system.data_exported'
  | 'system.error_occurred';
