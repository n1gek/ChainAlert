# Quick Reference: Database Operations

## Common Imports

```typescript
import { 
  createUser, getUser, updateUser,
  createSession, getSession, updateSession,
  addCheckIn, getSessionCheckIns,
  addEmergencyContact, getEmergencyContacts,
  createConsent, getUserConsents,
  createDocument, getUserDocuments,
  createAuditLog, getUserAuditLogs,
  createNotification, markNotificationAsRead,
  createEscalation, getEscalationConfig,
  getJurisdictions, getJurisdictionByState
} from '@/app/lib/database';

import { db } from '@/app/lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
```

---

## User Operations

### Create User
```typescript
await createUser(userId, {
  email: 'user@example.com',
  phone: '+1-555-0100',
  displayName: 'John Doe',
});
```

### Get User
```typescript
const user = await getUser(userId);
```

### Update User
```typescript
await updateUser(userId, {
  displayName: 'Jane Doe',
  preferredLanguage: 'es',
});
```

---

## Session Operations

### Create Session
```typescript
const sessionId = await createSession({
  userId: user.uid,
  startedAt: new Date().toISOString(),
  scheduledEndAt: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hours
  lastCheckInAt: new Date().toISOString(),
  checkInIntervalMinutes: 30,
  nextCheckInDue: new Date(Date.now() + 30 * 60000).toISOString(),
  startLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'New York, NY',
    city: 'New York',
    state: 'NY',
    timestamp: new Date().toISOString(),
  },
});
```

### Check In
```typescript
await addCheckIn(sessionId, {
  sessionId,
  userId: user.uid,
  status: 'safe',
  message: 'All good!',
  location: {
    latitude: 40.7589,
    longitude: -73.9851,
    accuracy: 10,
  },
});
```

### Get Active Sessions
```typescript
const activeSessions = await getActiveSessions(userId);
```

### Complete Session
```typescript
await completeSession(sessionId);
```

### Real-time Session Listener
```typescript
const unsubscribe = onSnapshot(
  doc(db, 'sessions', sessionId),
  (snapshot) => {
    const session = snapshot.data();
    // Calculate countdown
    const nextCheckIn = new Date(session.nextCheckInDue);
    const msRemaining = nextCheckIn - Date.now();
    const minutesRemaining = Math.floor(msRemaining / 60000);
    console.log(`Next check-in in ${minutesRemaining} minutes`);
  }
);

// Cleanup
return () => unsubscribe();
```

---

## Emergency Contact Operations

### Add Emergency Contact
```typescript
const contactId = await addEmergencyContact(userId, {
  name: 'Jane Doe',
  relationship: 'Best Friend',
  phone: '+1-555-0200',
  email: 'jane@example.com',
  priority: 1,
  notifyVia: ['sms', 'email'],
  isActive: true,
});
```

### Get Emergency Contacts
```typescript
const contacts = await getEmergencyContacts(userId);
// Returns contacts sorted by priority
```

### Update Emergency Contact
```typescript
await updateEmergencyContact(userId, contactId, {
  phone: '+1-555-0300',
  priority: 2,
});
```

---

## Consent Operations

### Create Consent
```typescript
await createConsent({
  userId: user.uid,
  consentVersion: 'v1.0.0',
  consentType: 'emergency_contact_notification',
  acceptedAt: new Date().toISOString(),
  approvedFields: ['location_sharing', 'emergency_notification'],
  dataCollectionConsent: true,
  locationSharingConsent: true,
  emergencyContactConsent: true,
  thirdPartyNotificationConsent: true,
  ipAddress: '192.168.1.1',
  userAgent: navigator.userAgent,
});
```

### Get User Consents
```typescript
const consents = await getUserConsents(userId);
```

---

## Document Operations

### Upload Document
```typescript
// First upload file to Firebase Storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/app/lib/firebase';

const file = /* File object */;
const storageRef = ref(storage, `users/${userId}/documents/${file.name}`);
await uploadBytes(storageRef, file);
const downloadUrl = await getDownloadURL(storageRef);

// Then create document record
await createDocument({
  userId,
  fileName: file.name,
  fileType: file.type,
  fileSize: file.size,
  storagePath: storageRef.fullPath,
  storageUrl: downloadUrl,
  documentType: 'evidence',
  isEncrypted: false,
  accessLevel: 'private',
});
```

### Get User Documents
```typescript
const documents = await getUserDocuments(userId);
```

---

## Audit Log Operations

### Create Audit Log
```typescript
await createAuditLog({
  userId: user.uid,
  userEmail: user.email,
  actorType: 'user',
  action: 'session.started',
  resource: 'session',
  resourceId: sessionId,
  description: 'User started a new safety session',
  status: 'success',
  severity: 'medium',
  requiresReview: false,
  ipAddress: '192.168.1.1',
  metadata: {
    sessionDuration: '2 hours',
    checkInInterval: '30 minutes',
  },
});
```

---

## Notification Operations

### Create Notification
```typescript
await createNotification({
  userId,
  type: 'session.check_in_reminder',
  title: 'Check-in Reminder',
  message: 'Time to check in on your active safety session',
  channels: ['push', 'sms'],
  priority: 'high',
  relatedResource: {
    type: 'session',
    id: sessionId,
  },
  actionUrl: `/session/${sessionId}`,
  actionLabel: 'Check In Now',
});
```

### Mark as Read
```typescript
await markNotificationAsRead(notificationId);
```

### Real-time Notifications
```typescript
const q = query(
  collection(db, 'notifications'),
  where('userId', '==', userId),
  where('status', '!=', 'read')
);

onSnapshot(q, (snapshot) => {
  const unread = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log(`${unread.length} unread notifications`);
});
```

---

## Escalation Operations

### Get Escalation Config
```typescript
const config = await getEscalationConfig(userId);
```

### Set Escalation Config
```typescript
await setEscalationConfig(userId, {
  step1: {
    enabled: true,
    delayMinutes: 5,
    contacts: [contactId1, contactId2],
    methods: ['sms', 'email'],
    message: 'Emergency! Please check on me.',
  },
  step2: {
    enabled: true,
    delayMinutes: 10,
    contacts: [contactId3],
    methods: ['sms', 'email', 'call'],
  },
  step3: {
    enabled: true,
    delayMinutes: 15,
    contactAuthorities: true,
    contacts: [],
    methods: ['sms'],
    includeLocation: true,
  },
});
```

---

## Jurisdiction Lookups

### Get All Jurisdictions
```typescript
const jurisdictions = await getJurisdictions();
// Returns all active jurisdictions sorted by state
```

### Get by State
```typescript
const caResources = await getJurisdictionByState('CA');
console.log(caResources.hotline); // "1-800-799-7233"
```

---

## Timer Calculations

### Calculate Time Remaining
```typescript
function getTimeRemaining(nextCheckInDue: string) {
  const deadline = new Date(nextCheckInDue);
  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();
  
  if (msRemaining <= 0) {
    return { expired: true, minutes: 0, seconds: 0 };
  }
  
  return {
    expired: false,
    minutes: Math.floor(msRemaining / 60000),
    seconds: Math.floor((msRemaining % 60000) / 1000),
    totalMs: msRemaining,
  };
}

// Usage
const session = await getSession(sessionId);
const timeLeft = getTimeRemaining(session.nextCheckInDue);
console.log(`${timeLeft.minutes}m ${timeLeft.seconds}s remaining`);
```

### Update Next Check-in Time
```typescript
await updateSession(sessionId, {
  nextCheckInDue: new Date(Date.now() + 30 * 60000).toISOString(), // 30 min
});
```

---

## Batch Operations

### Transaction Example
```typescript
import { runTransaction, doc } from 'firebase/firestore';

await runTransaction(db, async (transaction) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  const session = await transaction.get(sessionRef);
  
  if (!session.exists()) throw new Error('Session not found');
  
  transaction.update(sessionRef, {
    missedCheckIns: session.data().missedCheckIns + 1,
    escalationStep: 1,
  });
});
```

### Batch Write
```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);

contacts.forEach(contact => {
  const ref = doc(db, 'users', userId, 'emergencyContacts', contact.id);
  batch.set(ref, contact);
});

await batch.commit();
```

---

## Error Handling

```typescript
try {
  await createSession(sessionData);
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('User not authorized');
  } else if (error.code === 'unavailable') {
    console.error('Firestore temporarily unavailable');
  } else {
    console.error('Unexpected error:', error);
  }
  
  // Log the error
  await createAuditLog({
    userId: user?.uid,
    actorType: 'system',
    action: 'session.started',
    resource: 'session',
    description: 'Failed to create session',
    status: 'failure',
    errorMessage: error.message,
    severity: 'high',
    requiresReview: true,
  });
}
```

---

## Performance Tips

1. **Use Pagination**
   ```typescript
   import { query, limit, startAfter } from 'firebase/firestore';
   
   const q = query(
     collection(db, 'sessions'),
     where('userId', '==', userId),
     orderBy('startedAt', 'desc'),
     limit(25)
   );
   ```

2. **Cache Jurisdictions** (rarely change)
   ```typescript
   let jurisdictionsCache = null;
   
   async function getCachedJurisdictions() {
     if (!jurisdictionsCache) {
       jurisdictionsCache = await getJurisdictions();
     }
     return jurisdictionsCache;
   }
   ```

3. **Use Real-time Listeners Sparingly**
   - Only for data that needs real-time updates
   - Remember to unsubscribe
   - Prefer one-time reads for static data

---

**Quick Reference Complete! Bookmark this page for fast lookups.**
