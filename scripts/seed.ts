/**
 * Database Seeding Script
 * Populates initial data: jurisdictions and consent templates
 * 
 * Usage: npm run seed:database
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin
// Note: You need to download service account key from Firebase Console
// and save it as service-account-key.json in the project root
const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Jurisdiction Data - Sample US States
const jurisdictions = [
  {
    state: 'California',
    stateCode: 'CA',
    hotline: '1-800-799-7233',
    hotline247: true,
    localOrg: 'California Partnership to End Domestic Violence',
    shelters: ['Safe House SF: 415-555-0100', 'LA Family Justice Center: 213-555-0200'],
    legalAid: ['Bay Area Legal Aid: 1-800-551-5554'],
    counseling: ['California Coalition Against Sexual Assault'],
    emergencyNumber: '911',
    recordingConsent: 'two-party' as const,
    restrictiveOrderInfo: 'California offers Domestic Violence Restraining Orders (DVRO)',
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    state: 'New York',
    stateCode: 'NY',
    hotline: '1-800-942-6906',
    hotline247: true,
    localOrg: 'New York State Coalition Against Domestic Violence',
    shelters: ['Safe Horizon: 212-577-7777', 'Urban Resource Institute: 718-230-1300'],
    legalAid: ['Legal Aid Society: 212-577-3300'],
    counseling: ['NYC Family Justice Centers'],
    emergencyNumber: '911',
    recordingConsent: 'one-party' as const,
    restrictiveOrderInfo: 'Protection orders available through Family Court',
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    state: 'Texas',
    stateCode: 'TX',
    hotline: '1-800-799-7233',
    hotline247: true,
    localOrg: 'Texas Council on Family Violence',
    shelters: ['The Family Place: 214-941-1991', 'Houston Area Womens Center: 713-528-2121'],
    legalAid: ['Texas RioGrande Legal Aid: 1-888-988-9996'],
    counseling: ['Texas Association Against Sexual Assault'],
    emergencyNumber: '911',
    recordingConsent: 'one-party' as const,
    restrictiveOrderInfo: 'Texas offers Protective Orders through court',
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    state: 'Florida',
    stateCode: 'FL',
    hotline: '1-800-500-1119',
    hotline247: true,
    localOrg: 'Florida Coalition Against Domestic Violence',
    shelters: ['Sunrise of Pasco County: 352-521-3120'],
    legalAid: ['Florida Legal Services: 1-800-405-1417'],
    counseling: ['Florida Council Against Sexual Violence'],
    emergencyNumber: '911',
    recordingConsent: 'two-party' as const,
    restrictiveOrderInfo: 'Florida offers Domestic Violence Injunctions',
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    state: 'Illinois',
    stateCode: 'IL',
    hotline: '1-877-863-6338',
    hotline247: true,
    localOrg: 'Illinois Coalition Against Domestic Violence',
    shelters: ['Chicago Metropolitan Battered Women Network'],
    legalAid: ['Legal Aid Chicago: 312-341-1070'],
    emergencyNumber: '911',
    recordingConsent: 'two-party' as const,
    restrictiveOrderInfo: 'Orders of Protection available through court',
    isActive: true,
    lastUpdated: new Date().toISOString(),
  },
];

// Consent Templates
const consentTemplates = [
  {
    version: 'v1.0.0',
    type: 'terms_of_service' as const,
    title: 'Terms of Service',
    content: `
# Terms of Service

**Effective Date: February 6, 2026**

## 1. Acceptance of Terms

By using the Safety Alert application, you agree to these Terms of Service.

## 2. Service Description

Safety Alert provides personal safety check-in and emergency escalation services.

## 3. User Responsibilities

- Provide accurate information
- Maintain confidentiality of your account
- Use the service responsibly and lawfully

## 4. Emergency Services Disclaimer

This app is NOT a replacement for emergency services (911). In immediate danger, call 911.

## 5. Data Collection

We collect location data and session information as described in our Privacy Policy.

## 6. Service Availability

We strive for 99.9% uptime but cannot guarantee uninterrupted service.

## 7. Limitation of Liability

Safety Alert is provided "as is" without warranties. We are not liable for service interruptions or failures.

## 8. Changes to Terms

We may update these terms. Continued use constitutes acceptance of changes.

## Contact

For questions, contact: support@safetyalert.app
    `.trim(),
    effectiveDate: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    version: 'v1.0.0',
    type: 'privacy_policy' as const,
    title: 'Privacy Policy',
    content: `
# Privacy Policy

**Effective Date: February 6, 2026**

## Information We Collect

### Automatically Collected
- Session timestamps
- Location data (when you start sessions or check in)
- Device information

### User Provided
- Contact information
- Emergency contacts
- Session notes

## How We Use Your Information

- To provide safety check-in services
- To contact emergency contacts during escalations
- To improve our services

## Data Sharing

We only share your information:
- With emergency contacts you designate
- With law enforcement if required by law or during active escalations
- With service providers (e.g., SMS providers) necessary for service operation

## Data Retention

- Active session data: Retained while session is active
- Historical sessions: Retained for 7 years for legal compliance
- Account data: Retained until account deletion

## Your Rights

You have the right to:
- Access your data
- Request data deletion
- Export your data
- Revoke consent

## Security

We use industry-standard encryption and security practices.

## Contact

privacy@safetyalert.app
    `.trim(),
    effectiveDate: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    version: 'v1.0.0',
    type: 'emergency_contact_notification' as const,
    title: 'Emergency Contact Notification Consent',
    content: `
# Emergency Contact Notification Consent

By accepting this consent, you authorize Safety Alert to:

1. **Contact your designated emergency contacts** if you miss check-ins during an active safety session

2. **Share your location and session information** with emergency contacts during escalations

3. **Send notifications via SMS, email, and phone calls** to your emergency contacts

4. **Escalate to authorities** if configured in your escalation settings and all prior escalation steps fail

## What Information is Shared

During an escalation, emergency contacts receive:
- Your name
- Your last known location
- Session start time and details
- Your configured emergency message

## You Can

- Update emergency contacts anytime
- Modify escalation settings
- Revoke this consent (note: this will disable emergency escalation features)

## Important

This consent is required to use Safety Alert's core safety features.
    `.trim(),
    effectiveDate: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Seed Jurisdictions
    console.log('📍 Seeding jurisdictions...');
    let count = 0;
    for (const jurisdiction of jurisdictions) {
      const docRef = db.collection('jurisdictions').doc(jurisdiction.stateCode);
      await docRef.set(jurisdiction);
      count++;
      console.log(`  ✓ Added ${jurisdiction.state}`);
    }
    console.log(`✅ Successfully seeded ${count} jurisdictions\n`);

    // Seed Consent Templates
    console.log('📄 Seeding consent templates...');
    count = 0;
    for (const template of consentTemplates) {
      const docId = `${template.type}_${template.version}`;
      const docRef = db.collection('consentTemplates').doc(docId);
      await docRef.set(template);
      count++;
      console.log(`  ✓ Added ${template.title} (${template.version})`);
    }
    console.log(`✅ Successfully seeded ${count} consent templates\n`);

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
