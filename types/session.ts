// Session Type - Safety Check-in Sessions
export type Session = {
  id: string;
  userId: string;
  
  // Timing Information
  startedAt: string; // ISO timestamp
  scheduledEndAt: string; // When user expects to be safe
  lastCheckInAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp (if successfully completed)
  
  // Check-in Configuration
  checkInIntervalMinutes: number; // How often user should check in
  nextCheckInDue: string; // ISO timestamp
  missedCheckIns: number; // Counter for missed check-ins
  
  // Location Data
  startLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    timestamp: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    timestamp: string;
  };
  
  // Status & Escalation
  status: 'active' | 'completed' | 'escalated' | 'cancelled' | 'expired';
  escalationStep: number; // 0 = no escalation, 1-3 = escalation levels
  escalationStartedAt?: string; // ISO timestamp
  escalationReason?: string;
  
  // Session Details
  activityType?: string; // 'date', 'meeting', 'travel', etc.
  notes?: string; // User notes about the session
  
  // Jurisdiction (for state-specific resources)
  jurisdiction?: {
    state: string;
    county?: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
};

// Check-in Record Type (Subcollection under sessions)
export type CheckIn = {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: string; // ISO timestamp
  
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  
  status: 'safe' | 'concern' | 'emergency';
  message?: string; // Optional user message
  
  createdAt: string;
};

// Session Statistics
export type SessionStats = {
  userId: string;
  totalSessions: number;
  completedSessions: number;
  escalatedSessions: number;
  cancelledSessions: number;
  averageDurationMinutes: number;
  lastSessionAt?: string;
  updatedAt: string;
};
