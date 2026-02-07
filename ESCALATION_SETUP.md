# Emergency Escalation System Setup

## ✅ Completed Components

### 1. **Escalation Manager** (`app/lib/escalation.ts`)
- Calculates escalation phase based on session timer
- Phases: Soft Warning → Medium Alert → Critical Alert → Emergency
- Determines time until next escalation
- Integrated with database layer

### 2. **Email Notification System** (`app/api/notifications/email/route.ts`)
- 4 email templates:
  - **Soft Warning**: 15-minute nudge to check in
  - **Medium Alert**: 60-minute urgent reminder
  - **Critical Alert**: All contacts being notified
  - **Emergency**: Immediate activation confirmation
- Uses **Resend API** (3,000 emails/month free)
- HTML-formatted emails with location, session details, action buttons

### 3. **Contact Notifications** (`app/api/notifications/contacts/route.ts`)
- Notifies emergency contacts with location + session details
- Notifies legal organizations (if consented)
- Custom templates for each contact type
- Includes call-to-action instructions

### 4. **Emergency Instant Notifications** (`app/api/notifications/emergency/route.ts`)
- Triggered when user presses emergency button
- Sends to:
  - User themselves
  - ALL emergency contacts
  - ALL legal organizations (if consented)
- Includes GPS coordinates + location address
- High-priority formatting with urgent instructions

### 5. **Cron Job Scheduler** (`app/api/cron/check-sessions/route.ts`)
- Runs every 5 minutes via Vercel Cron
- Checks all active sessions for escalation
- Prevents duplicate notifications using escalation history
- Includes manual trigger endpoint for testing

### 6. **Vercel Configuration** (`vercel.json`)
- Configured to run cron job every 5 minutes
- Production-ready deployment

---

## 🚀 Next Steps

### **Step 1: Get Resend API Key** (5 minutes)
1. Go to https://resend.com
2. Sign up (free account)
3. Create API key in dashboard
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_your_key_here
   CRON_SECRET=your_random_secret_here
   ```

### **Step 2: Update Email Address** 
In your emails, replace `alerts@chainalert.app` with your verified domain in Resend.

### **Step 3: Connect to Emergency Button**
Update `app/home/page.tsx` `emergencyStop()` function:

```typescript
// Replace the TODO comment with:
const response = await fetch('/api/notifications/emergency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.uid,
    sessionId: activeSession.sessionId,
    session: activeSession,
    location: activeSession.location
  })
});

const result = await response.json();
if (result.success) {
  alert(`✅ Emergency alerts sent to ${result.notificationsSent} recipients`);
} else {
  alert('❌ Failed to send emergency notifications');
}
```

### **Step 4: Test Escalation**
Send POST to `/api/cron/check-sessions`:
```bash
curl -X POST http://localhost:3000/api/cron/check-sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test_session_id"}'
```

---

## 📋 How It Works

### **User Session Timeline:**

```
0 min: Session starts → No escalation
    ↓
15 min: Timer expires → SOFT WARNING email
    ↓
60 min: Still no check-in → MEDIUM ALERT email + notify TRUSTED CONTACTS
    ↓
1440 min (24 hours): Critical → Notify LEGAL ORGANIZATIONS (if consented)
    ↓
Anytime: Emergency button → Instant notifications to all
```

### **Email Escalation Phases:**

| Phase | Time | Recipients | Action |
|-------|------|-----------|--------|
| **Soft Warning** | 0-15 min | User | Nudge to check in |
| **Medium Alert** | 15-60 min | User | Urgent reminder |
| **Critical Alert** | 60+ min | Trusted Contacts | Full notification with location |
| **Legal Alert** | 1440+ min (24h) | Legal Organizations | Legal organization notification |
| **Emergency** | Instant | Everyone | All-hands alert |

---

## 🔧 Configuration

### Environment Variables
```env
RESEND_API_KEY=re_xxxxx              # Get from Resend
CRON_SECRET=your_secret_key_here     # Secure cron endpoint
```

### Email Templates
All templates located in API routes with HTML formatting:
- Professional design
- Clear call-to-action buttons
- Location maps
- Session information
- Legal disclaimers

---

## 📊 Database Collections Needed

### Create in Firestore:
```firestore
escalations/
├── escalationId
├── sessionId
├── userId
├── phase (soft_warning | medium_alert | critical_alert | emergency)
├── timestamp
├── notificationsSent (boolean)
└── details (object)
```

---

## 🚨 Emergency Button Integration

Already implemented in `/app/home/page.tsx`:
- Button disabled when no active session
- Always enabled (fixable)
- Triggers via `emergencyStop()` function
- Calls `/api/notifications/emergency`

---

## 📱 Optional Features

### SMS Notifications (Not Yet Implemented)
```typescript
// Add to medium_alert phase:
const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN);
await client.messages.create({
  body: 'ChainAlert: Please check in for your safety session',
  from: '+1234567890',
  to: userPhone
});
```

**Free SMS Services:**
- Twilio: $15 free trial
- Textbelt: 1 free SMS/day
- Vonage: $2 free credit

---

## ✅ Testing Checklist

- [ ] Resend API key added and working
- [ ] Email templates display correctly
- [ ] Emergency button sends notifications
- [ ] Cron job runs every 5 minutes
- [ ] Escalation phases trigger correctly
- [ ] Contacts receive appropriate emails
- [ ] Location data included in emails
- [ ] Legal organizations notified for critical phase

---

## 📞 Support Resources Included

In emergency emails:
- 911 (Emergency)
- 1-888-351-4024 (ICE Detainee Hotline)
- 1-877-336-8800 (ACLU Immigrants' Rights)

---

**The system is now ready for testing. Start with Resend setup, then test emergency button!**
