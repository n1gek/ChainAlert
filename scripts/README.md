# Database Seeding

This directory contains scripts for populating the Firestore database with initial data.

## Setup

1. **Download Service Account Key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the file as `service-account-key.json` in the project root
   - **IMPORTANT**: Add this file to `.gitignore` (never commit it!)

2. **Install Dependencies**
   ```bash
   cd scripts
   npm install
   ```

## Usage

### Seed All Data

```bash
npm run seed
```

This will populate:
- **Jurisdictions**: State-specific resources for CA, NY, TX, FL, IL
- **Consent Templates**: Terms of Service, Privacy Policy, Emergency Contact Consent

### Verify Data

After seeding, check Firebase Console to verify data was created correctly.

## Adding More Data

### Add More States

Edit `seed.ts` and add to the `jurisdictions` array:

```typescript
{
  state: 'Your State',
  stateCode: 'YS',
  hotline: '1-800-XXX-XXXX',
  // ... other fields
}
```

### Update Consent Templates

To create a new version:
1. Update the `version` field (e.g., `v1.1.0`)
2. Modify the `content` field
3. Run the seed script
4. Old versions remain in the database (for compliance)

## Security

⚠️ **Never commit `service-account-key.json` to version control**

Add to `.gitignore`:
```
service-account-key.json
scripts/service-account-key.json
```

## Troubleshooting

### Permission Denied
- Ensure service account has Firestore write permissions
- Check Firebase project ID in service account key matches your project

### Module Not Found
```bash
cd scripts
npm install
```

### TypeScript Errors
```bash
npm install --save-dev @types/node
```
