// Consent Record Type - Legal compliance
export type Consent = {
  id: string;
  userId: string;
  
  // Consent Details
  consentVersion: string; // e.g., "v1.0.0"
  consentType: 'terms_of_service' | 'privacy_policy' | 'data_sharing' | 'emergency_contact_notification';
  
  // Acceptance Info
  acceptedAt: string; // ISO timestamp
  ipAddress?: string; // For audit trail
  userAgent?: string; // Browser/device info
  
  // Consent Scope
  approvedFields: string[]; // Specific permissions granted
  dataCollectionConsent: boolean;
  locationSharingConsent: boolean;
  emergencyContactConsent: boolean;
  thirdPartyNotificationConsent: boolean;
  
  // Status
  isActive: boolean;
  revokedAt?: string; // ISO timestamp if consent withdrawn
  expiresAt?: string; // ISO timestamp for time-limited consent
  
  // Related Data
  sessionRef?: string; // Optional: consent given during a session
  
  // Metadata
  createdAt: string;
  updatedAt: string;
};

// Consent Template Type (for version management)
export type ConsentTemplate = {
  version: string;
  type: 'terms_of_service' | 'privacy_policy' | 'data_sharing' | 'emergency_contact_notification';
  title: string;
  content: string; // Markdown or HTML
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
};
