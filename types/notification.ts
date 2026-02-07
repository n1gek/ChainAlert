// Notification Type - System messages and updates
export type Notification = {
  id: string;
  userId: string;
  
  // Content
  type: NotificationType;
  title: string;
  message: string;
  
  // Delivery
  channels: ('push' | 'email' | 'sms' | 'in_app')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Status
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  
  // Related Resources
  relatedResource?: {
    type: 'session' | 'document' | 'consent' | 'escalation';
    id: string;
  };
  
  // Actions
  actionUrl?: string; // Deep link or URL
  actionLabel?: string; // "View Session", "Update Consent", etc.
  
  // Metadata
  expiresAt?: string; // Auto-delete old notifications
  createdAt: string;
  updatedAt: string;
};

export type NotificationType =
  // Session Notifications
  | 'session.check_in_reminder'
  | 'session.check_in_missed'
  | 'session.completed'
  | 'session.escalation_warning'
  
  // Safety Notifications
  | 'emergency.contact_notified'
  | 'emergency.escalation_active'
  | 'emergency.authorities_contacted'
  
  // Account Notifications
  | 'account.welcome'
  | 'account.verification_required'
  | 'account.password_changed'
  | 'account.login_new_device'
  
  // Compliance Notifications
  | 'consent.update_required'
  | 'consent.expiring_soon'
  | 'privacy.data_export_ready'
  
  // System Notifications
  | 'system.maintenance_scheduled'
  | 'system.feature_announcement'
  | 'system.security_alert';

// Notification Preferences
export type NotificationPreferences = {
  userId: string;
  
  // Channel Preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  
  // Type Preferences
  checkInReminders: boolean;
  escalationAlerts: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "07:00"
  quietHoursTimezone?: string;
  
  updatedAt: string;
};
