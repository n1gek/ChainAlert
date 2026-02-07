# Database Setup Guide

## Quick Start

### 1. Prerequisites

```bash
npm install -g firebase-tools
firebase login
```

### 2. Configure Firebase Project

Update your `.env.local` file with Firebase credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 4. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### 5. Seed Initial Data (Optional)

Create a seed script to populate jurisdictions and consent templates:

```bash
npm run seed:database
```

---

## Database Collections

### Core Collections

- **users** - User profiles and account data
- **sessions** - Active safety check-in sessions (with timer data)
- **consents** - Legal consent records
- **documents** - Document metadata (files in Storage)
- **auditLogs** - Comprehensive activity logging
- **escalations** - Emergency escalation records
- **notifications** - In-app and cross-channel notifications
- **jurisdictions** - State-specific resources (public)

### Configuration Collections

- **escalationConfigs** - User escalation preferences
- **consentTemplates** - Versioned consent forms

### Statistics Collections

- **sessionStats** - Aggregated user session data

---

## Using the Database

### Import Utility Functions

```typescript
import {
  createUser,
  getUser,
  createSession,
  addCheckIn,
  createAuditLog,
  getEmergencyContacts,
} from '@/app/lib/database';
```

### Example: Create a Session

```typescript
const sessionId = await createSession({
  userId: 'user123',
  startedAt: new Date().toISOString(),
  scheduledEndAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
  lastCheckInAt: new Date().toISOString(),
  checkInIntervalMinutes: 30,
  nextCheckInDue: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  startLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: "Times Square, NYC",
    city: "New York",
    state: "NY",
    timestamp: new Date().toISOString(),
  },
});
```

### Example: Check In

```typescript
await addCheckIn(sessionId, {
  sessionId,
  userId: 'user123',
  status: 'safe',
  message: 'All good!',
  location: {
    latitude: 40.7589,
    longitude: -73.9851,
    accuracy: 10,
  },
});
```

### Example: Get Emergency Contacts

```typescript
const contacts = await getEmergencyContacts('user123');
// Returns contacts sorted by priority
```

---

## Real-time Listeners

### Listen to Active Session

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

const unsubscribe = onSnapshot(
  doc(db, 'sessions', sessionId),
  (snapshot) => {
    const session = snapshot.data();
    console.log('Session updated:', session);
  }
);

// Cleanup
return () => unsubscribe();
```

### Listen to Notifications

```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const q = query(
  collection(db, 'notifications'),
  where('userId', '==', userId),
  where('status', '!=', 'read')
);

onSnapshot(q, (snapshot) => {
  const unreadNotifications = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log('Unread notifications:', unreadNotifications);
});
```

---

## Timer Implementation

Timers use **database timestamps** as the source of truth:

```typescript
// Calculate time remaining
const session = await getSession(sessionId);
const nextCheckIn = new Date(session.nextCheckInDue);
const now = new Date();
const msRemaining = nextCheckIn.getTime() - now.getTime();
const minutesRemaining = Math.floor(msRemaining / 60000);
```

**Client-side countdown** is for display only. The server (Cloud Functions) checks `nextCheckInDue` to trigger escalations.

---

## Audit Logging

All critical actions should create audit logs:

```typescript
await createAuditLog({
  userId: 'user123',
  userEmail: 'user@example.com',
  actorType: 'user',
  action: 'session.started',
  resource: 'session',
  resourceId: sessionId,
  description: 'User started a new safety session',
  status: 'success',
  severity: 'low',
  requiresReview: false,
});
```

---

## Security Rules Testing

Test security rules locally:

```bash
firebase emulators:start --only firestore
npm run test:firestore-rules
```

---

## Common Patterns

### Transaction Example

```typescript
import { runTransaction, doc } from 'firebase/firestore';

await runTransaction(db, async (transaction) => {
  const sessionRef = doc(db, 'sessions', sessionId);
  const session = await transaction.get(sessionRef);
  
  if (!session.exists()) {
    throw new Error('Session not found');
  }
  
  const newMissedCount = session.data().missedCheckIns + 1;
  
  transaction.update(sessionRef, {
    missedCheckIns: newMissedCount,
    updatedAt: new Date().toISOString(),
  });
});
```

### Batch Write Example

```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);

contacts.forEach(contact => {
  const contactRef = doc(db, 'users', userId, 'emergencyContacts', contact.id);
  batch.set(contactRef, contact);
});

await batch.commit();
```

---

## Troubleshooting

### Index Not Found Error

If you see "The query requires an index", Firebase Console will provide a direct link to create it, or add it to `firestore.indexes.json` and redeploy.

### Permission Denied

Check:
1. User is authenticated: `firebase.auth().currentUser`
2. Security rules allow the operation
3. User owns the resource (userId matches)

### Slow Queries

- Ensure composite indexes exist
- Limit query results with `.limit()`
- Use pagination with `.startAfter()`

---

## Monitoring

### Enable Firestore Usage Metrics

```bash
firebase projects:addfirebase --project your-project-id
```

### Set Up Alerts

In Google Cloud Console:
1. Go to Firestore → Monitoring
2. Create alerts for:
   - Read/Write volume spikes
   - Security rule denials
   - Query latency

---

## Migration Scripts

Create migration scripts in `/scripts/migrations/`:

```typescript
// scripts/migrations/001-add-timezone-to-users.ts
import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function migrate() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
  for (const userDoc of snapshot.docs) {
    await updateDoc(doc(db, 'users', userDoc.id), {
      timezone: 'America/New_York', // Default
    });
  }
  
  console.log(`Migrated ${snapshot.size} users`);
}

migrate();
```

---

## Backup & Restore

### Export Data

```bash
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

### Import Data

```bash
gcloud firestore import gs://your-bucket/backup-20260206
```

---

## Related Documentation

- [Database Schema](./DATABASE_SCHEMA.md) - Complete schema reference
- [Type Definitions](./types/) - TypeScript types
- [Firestore Rules](./firestore.rules) - Security rules
- [Cloud Functions](./functions/README.md) - Backend logic

---

*Last Updated: February 6, 2026*
