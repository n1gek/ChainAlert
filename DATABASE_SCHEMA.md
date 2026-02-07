# Firestore Database Schema Documentation

## Overview

This document describes the complete Firestore database structure for the Safety Alert application. The database is designed to support real-time safety check-ins, emergency escalations, document management, and comprehensive audit trails for compliance.

## Architecture Principles

1. **User Privacy**: User data is scoped and protected by security rules
2. **Compliance**: Comprehensive audit logging for all critical actions
3. **Real-time Updates**: Firestore real-time listeners for session monitoring
4. **Scalability**: Efficient indexing and query patterns
5. **Data Integrity**: Timestamps and validation at all levels

---

## Collections Structure

```
firestore/
├── users/
│   ├── {userId}/
│   │   ├── emergencyContacts/
│   │   ├── settings/
│   │   └── notificationPreferences/
├── sessions/
│   └── {sessionId}/
│       └── checkIns/
├── consents/
├── consentTemplates/
├── documents/
│   └── {documentId}/
│       └── shares/
├── auditLogs/
├── escalations/
├── escalationConfigs/
├── notifications/
├── sessionStats/
└── jurisdictions/
```

---

## Collection Details

### 1. `users/` Collection

**Purpose**: Store user profiles and account information

**Document ID**: Firebase Auth UID

**Schema**:
```typescript
{
  id: string;                    // Firebase Auth UID
  email: string;                 // User email (verified)
  phone: string;                 // Phone number for SMS
  displayName: string;           // User's display name
  
  // Optional Profile
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
  isActive: boolean;             // Account enabled
  isVerified: boolean;           // Email verified
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  lastLoginAt?: string;          // ISO timestamp
  
  // Safety Settings
  defaultCheckInInterval?: number;  // Minutes
  autoEscalationEnabled: boolean;
  
  // Metadata
  consentVersion?: string;
  hasCompletedOnboarding: boolean;
}
```

**Indexes**:
- `email` (for lookups)
- `createdAt` (descending)

**Security**: Users can only read/write their own data

---

#### Subcollection: `users/{userId}/emergencyContacts/`

**Purpose**: Store emergency contacts who will be notified during escalations

**Schema**:
```typescript
{
  id: string;
  userId: string;
  name: string;
  relationship: string;          // "Partner", "Friend", etc.
  phone: string;
  email?: string;
  priority: number;              // 1 = primary, 2 = secondary
  notifyVia: ('sms' | 'email' | 'call')[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**: `priority` (ascending), `isActive`

---

### 2. `sessions/` Collection

**Purpose**: Track active and historical safety sessions with timer information

**Document ID**: Auto-generated

**Schema**:
```typescript
{
  id: string;
  userId: string;
  
  // Timing - CRITICAL FOR TIMER FUNCTIONALITY
  startedAt: string;             // ISO timestamp - session start
  scheduledEndAt: string;        // ISO timestamp - when user expects to be safe
  lastCheckInAt: string;         // ISO timestamp - last successful check-in
  completedAt?: string;          // ISO timestamp - session completion
  
  // Check-in Configuration
  checkInIntervalMinutes: number;  // How often to check in (e.g., 15, 30, 60)
  nextCheckInDue: string;          // ISO timestamp - calculated deadline
  missedCheckIns: number;          // Counter for missed check-ins
  
  // Location Data
  startLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    timestamp: string;
  };
  currentLocation?: { ... };     // Same structure
  
  // Status & Escalation
  status: 'active' | 'completed' | 'escalated' | 'cancelled' | 'expired';
  escalationStep: number;        // 0 = none, 1-3 = escalation level
  escalationStartedAt?: string;
  escalationReason?: string;
  
  // Session Details
  activityType?: string;         // 'date', 'meeting', 'travel'
  notes?: string;
  
  jurisdiction?: {
    state: string;
    county?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- Composite: `userId` + `status` + `startedAt` (descending)
- Composite: `status` + `nextCheckInDue` (ascending) - for batch processing
- Single: `nextCheckInDue` (ascending)

**Query Patterns**:
```javascript
// Get active sessions for a user
query(sessionsRef, 
  where('userId', '==', userId),
  where('status', '==', 'active'),
  orderBy('startedAt', 'desc')
)

// Find sessions needing evaluation (Cloud Function)
query(sessionsRef,
  where('status', '==', 'active'),
  where('nextCheckInDue', '<=', new Date().toISOString())
)
```

---

#### Subcollection: `sessions/{sessionId}/checkIns/`

**Purpose**: Log each check-in event for session history

**Schema**:
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  timestamp: string;             // ISO timestamp
  
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  
  status: 'safe' | 'concern' | 'emergency';
  message?: string;              // Optional user message
  
  createdAt: string;
}
```

---

### 3. `consents/` Collection

**Purpose**: Track user consent for legal compliance (GDPR, CCPA, etc.)

**Schema**:
```typescript
{
  id: string;
  userId: string;
  
  consentVersion: string;        // "v1.0.0"
  consentType: 'terms_of_service' | 'privacy_policy' | 'data_sharing' | 'emergency_contact_notification';
  
  acceptedAt: string;
  ipAddress?: string;            // For compliance
  userAgent?: string;
  
  approvedFields: string[];
  dataCollectionConsent: boolean;
  locationSharingConsent: boolean;
  emergencyContactConsent: boolean;
  thirdPartyNotificationConsent: boolean;
  
  isActive: boolean;
  revokedAt?: string;
  expiresAt?: string;
  
  sessionRef?: string;
  
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**: 
- Composite: `userId` + `consentType` + `isActive`
- Single: `acceptedAt` (descending)

**Compliance Notes**: 
- Consent records CANNOT be deleted (set `isActive: false` instead)
- Audit logs track all consent changes

---

### 4. `documents/` Collection

**Purpose**: Store metadata for user-uploaded documents (actual files in Firebase Storage)

**Schema**:
```typescript
{
  id: string;
  userId: string;
  sessionId?: string;
  
  // File Info
  fileName: string;
  fileType: string;              // MIME type
  fileSize: number;              // bytes
  storagePath: string;           // Firebase Storage path
  storageUrl?: string;
  
  documentType: 'evidence' | 'report' | 'communication' | 'legal' | 'other';
  category?: string;
  
  title?: string;
  description?: string;
  tags?: string[];
  
  // Security
  isEncrypted: boolean;
  accessLevel: 'private' | 'emergency_contacts' | 'authorities' | 'public';
  sharedWith?: string[];         // User IDs
  
  isActive: boolean;
  isArchived: boolean;
  archivedAt?: string;
  
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

**Storage Path Convention**: `users/{userId}/documents/{documentId}/{fileName}`

**Indexes**: `userId` + `isActive` + `uploadedAt`

---

### 5. `auditLogs/` Collection

**Purpose**: Comprehensive activity logging for compliance and security

**Schema**:
```typescript
{
  id: string;
  
  userId?: string;
  userEmail?: string;
  actorType: 'user' | 'system' | 'admin' | 'function';
  
  action: string;                // See AuditAction type
  resource: string;              // 'session', 'user', 'consent'
  resourceId?: string;
  
  description: string;
  metadata?: Record<string, any>;
  
  status: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresReview: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  
  location?: { ... };
  
  timestamp: string;
  createdAt: string;
}
```

**Indexes**: 
- Composite: `userId` + `timestamp` (descending)
- Composite: `severity` + `requiresReview` + `timestamp`
- Single: `action`

**Retention**: Keep indefinitely for compliance (implement archival after 7 years)

**IMPORTANT**: Audit logs are write-only. No updates or deletes allowed.

---

### 6. `escalations/` Collection

**Purpose**: Track emergency escalation processes and their outcomes

**Schema**:
```typescript
{
  id: string;
  sessionId: string;
  userId: string;
  
  currentStep: number;           // 1, 2, or 3
  maxSteps: number;              // Usually 3
  status: 'active' | 'resolved' | 'cancelled' | 'completed';
  
  triggeredAt: string;
  triggerReason: 'missed_check_in' | 'manual' | 'panic_button' | 'scheduled_end_passed';
  
  steps: EscalationStep[];       // Step history
  
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  
  location?: { ... };
  
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**: 
- Composite: `userId` + `status` + `triggeredAt`
- Composite: `sessionId` + `status`

---

### 7. `escalationConfigs/` Collection

**Purpose**: Store user-specific escalation configurations

**Document ID**: userId (one config per user)

**Schema**: See [escalation.ts](../types/escalation.ts) for `EscalationConfig` type

---

### 8. `notifications/` Collection

**Purpose**: In-app notifications and cross-channel messaging

**Schema**:
```typescript
{
  id: string;
  userId: string;
  
  type: NotificationType;
  title: string;
  message: string;
  
  channels: ('push' | 'email' | 'sms' | 'in_app')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  
  relatedResource?: {
    type: 'session' | 'document' | 'consent' | 'escalation';
    id: string;
  };
  
  actionUrl?: string;
  actionLabel?: string;
  
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Cleanup**: Use Cloud Function to delete expired notifications daily

---

### 9. `sessionStats/` Collection

**Purpose**: Aggregate statistics for user dashboard

**Document ID**: userId

**Schema**:
```typescript
{
  userId: string;
  totalSessions: number;
  completedSessions: number;
  escalatedSessions: number;
  cancelledSessions: number;
  averageDurationMinutes: number;
  lastSessionAt?: string;
  updatedAt: string;
}
```

**Updated By**: Cloud Functions (triggered on session completion/escalation)

---

### 10. `jurisdictions/` Collection

**Purpose**: State-specific resources and regulations (public data)

**Schema**: See [jurisdiction.ts](../types/jurisdiction.ts)

**Security**: Public read access, admin-only write

---

## Database Initialization

To initialize the database with required data:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Seed jurisdiction data (create a seed script)
npm run seed:jurisdictions
```

---

## Cloud Functions Integration

The following Cloud Functions interact with the database:

1. **`evaluateSession`** - Scheduled function (every 1 minute)
   - Queries sessions where `nextCheckInDue <= now()`
   - Triggers escalation if check-in missed
   - Updates session status

2. **`executeEscalation`** - HTTP/Firestore trigger
   - Reads `escalationConfigs/{userId}`
   - Sends notifications to emergency contacts
   - Updates escalation steps
   - Creates audit logs

3. **`updateSessionStats`** - Firestore trigger (on session complete)
   - Updates `sessionStats/{userId}`
   - Aggregates completion rates

4. **`cleanupExpiredNotifications`** - Scheduled (daily)
   - Deletes notifications where `expiresAt < now()`

---

## Performance Optimization

### Composite Indexes Required

Create in Firebase Console or via `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "nextCheckInDue", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "auditLogs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Caching Strategy

- **Client-side**: Cache session data in localStorage for offline UI
- **Firestore**: Enable persistence for offline support
- **Server-side**: Use Cloud Functions memory caching for jurisdiction data

---

## Security Best Practices

1. **Authentication Required**: All collections require authentication (except public jurisdictions)
2. **User Isolation**: Security rules enforce userId matching
3. **Audit Everything**: All CRUD operations create audit logs
4. **Consent Verification**: Check active consent before data processing
5. **Rate Limiting**: Implement Cloud Functions rate limiting for writes

---

## Backup & Recovery

### Automated Backups
```bash
# Schedule daily exports
gcloud firestore export gs://[BUCKET_NAME]/firestore-backups/$(date +%Y%m%d)
```

### Point-in-Time Recovery
Firestore provides built-in point-in-time recovery for production databases.

---

## Migration Plan

When schema changes are needed:

1. **Add new fields** - Always optional with defaults
2. **Version consent templates** - Increment `consentVersion`
3. **Migrate data** - Use Cloud Functions batch writes
4. **Update security rules** - Deploy with `--only firestore:rules`
5. **Run migrations** - Use admin SDK for batch updates

---

## Monitoring & Alerts

Set up Cloud Monitoring alerts for:

- High read/write volumes
- Failed security rule denials
- Escalation triggers
- Consent expirations
- Failed Cloud Function executions

---

## Compliance Notes

This database structure supports:

- **GDPR**: User data export, consent management, right to deletion
- **CCPA**: Data disclosure, deletion requests
- **HIPAA**: Audit trails, encryption requirements
- **Legal Hold**: Immutable audit logs

---

## Related Files

- Type Definitions: `/types/*.ts`
- Security Rules: `/firestore.rules`
- Utility Functions: `/app/lib/database.ts`
- Cloud Functions: `/functions/src/*.ts`

---

*Last Updated: February 6, 2026*
