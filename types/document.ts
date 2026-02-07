// Document Type - User uploaded documents and evidence
export type Document = {
  id: string;
  userId: string;
  sessionId?: string; // Optional: linked to a specific session
  
  // File Information
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  storagePath: string; // Firebase Storage path
  storageUrl?: string; // Download URL (temporary or permanent)
  
  // Classification
  documentType: 'evidence' | 'report' | 'communication' | 'legal' | 'other';
  category?: string; // e.g., 'photos', 'messages', 'police_report'
  
  // Metadata
  title?: string;
  description?: string;
  tags?: string[];
  
  // Privacy & Security
  isEncrypted: boolean;
  accessLevel: 'private' | 'emergency_contacts' | 'authorities' | 'public';
  sharedWith?: string[]; // Array of user IDs
  
  // Status
  isActive: boolean;
  isArchived: boolean;
  archivedAt?: string;
  
  // Timestamps
  uploadedAt: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
};

// Document Share Record
export type DocumentShare = {
  id: string;
  documentId: string;
  sharedBy: string; // userId
  sharedWith: string; // email or userId
  accessLevel: 'view' | 'download';
  expiresAt?: string;
  createdAt: string;
};
