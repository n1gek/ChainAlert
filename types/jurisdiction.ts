// Jurisdiction Type - State-specific resources and regulations
export type Jurisdiction = {
  id: string;
  
  // Location
  state: string; // Full state name
  stateCode: string; // Two-letter code (e.g., "CA", "NY")
  county?: string;
  
  // Resources
  localOrg?: string; // Local advocacy organization
  hotline: string; // Crisis hotline number
  hotline247: boolean; // Is hotline available 24/7
  
  // Additional Resources
  shelters?: string[]; // List of shelter contact info
  legalAid?: string[]; // Legal aid resources
  counseling?: string[]; // Counseling services
  
  // Regulations
  consentAge?: number; // Age of consent
  recordingConsent?: 'one-party' | 'two-party'; // Recording laws
  restrictiveOrderInfo?: string; // Info about restraining orders
  
  // Emergency Services
  emergencyNumber: string; // Usually "911"
  nonEmergencyNumber?: string;
  
  // Metadata
  lastUpdated: string;
  isActive: boolean;
};
