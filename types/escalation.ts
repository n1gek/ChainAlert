// Escalation Type - Emergency escalation records
export type Escalation = {
  id: string;
  sessionId: string;
  userId: string;
  
  // Escalation Details
  currentStep: number; // 1, 2, 3
  maxSteps: number; // Usually 3
  status: 'active' | 'resolved' | 'cancelled' | 'completed';
  
  // Trigger Information
  triggeredAt: string; // ISO timestamp
  triggerReason: 'missed_check_in' | 'manual' | 'panic_button' | 'scheduled_end_passed';
  
  // Timeline
  steps: EscalationStep[];
  
  // Resolution
  resolvedAt?: string;
  resolvedBy?: string; // userId or 'system'
  resolutionNotes?: string;
  
  // Location at escalation
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    state?: string;
    timestamp: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
};

export type EscalationStep = {
  stepNumber: number;
  stepType: 'notification' | 'contact_emergency' | 'contact_authorities';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  
  // Execution
  startedAt?: string;
  completedAt?: string;
  
  // Actions Taken
  actions: EscalationAction[];
  
  // Next Step
  nextStepAt?: string; // When to move to next step if no resolution
  
  notes?: string;
};

export type EscalationAction = {
  id: string;
  actionType: 'sms' | 'email' | 'call' | 'push_notification' | 'authorities_contacted';
  recipient: string; // phone number, email, or contact ID
  recipientName?: string;
  
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'responded';
  
  // Message Content
  message?: string;
  template?: string;
  
  // Delivery Info
  sentAt?: string;
  deliveredAt?: string;
  respondedAt?: string;
  response?: string;
  
  // Error handling
  errorMessage?: string;
  retryCount?: number;
  maxRetries?: number;
  
  timestamp: string;
};

// Escalation Configuration
export type EscalationConfig = {
  userId: string;
  
  // Step Configuration
  step1: {
    enabled: boolean;
    delayMinutes: number; // How long to wait before step 1
    contacts: string[]; // Emergency contact IDs
    methods: ('sms' | 'email' | 'call')[];
    message?: string; // Custom message template
  };
  
  step2: {
    enabled: boolean;
    delayMinutes: number; // Additional time after step 1
    contacts: string[];
    methods: ('sms' | 'email' | 'call')[];
    message?: string;
  };
  
  step3: {
    enabled: boolean;
    delayMinutes: number; // Additional time after step 2
    contactAuthorities: boolean;
    contacts: string[];
    methods: ('sms' | 'email' | 'call')[];
    message?: string;
    includeLocation: boolean;
  };
  
  updatedAt: string;
};
