// User Profile Type
export type User = {
  id: string; // Firebase Auth UID
  email: string;
  phone: string;
  displayName: string;
  
  // Profile Information
  dateOfBirth?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Preferences
  preferredLanguage?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  
  // Account Status
  isActive: boolean;
  isVerified: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  lastLoginAt?: string; // ISO timestamp
  
  // Safety Settings
  defaultCheckInInterval?: number; // minutes
  autoEscalationEnabled: boolean;
  
  // Metadata
  consentVersion?: string; // Latest accepted consent version
  hasCompletedOnboarding: boolean;
};

// Emergency Contact Type (Subcollection under users)
export type EmergencyContact = {
  id: string;
  userId: string; // Reference to user
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  priority: number; // 1 = primary, 2 = secondary, etc.
  notifyVia: ('sms' | 'email' | 'call')[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// User Settings Type
export type UserSettings = {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  emergencyMessage?: string; // Custom message to send in emergencies
  updatedAt: string;
};
