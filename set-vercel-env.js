// set-vercel-env.js
// Script to set Vercel environment variables via API
// Update the values below with your actual credentials
const https = require('https');

const envVars = {
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'YOUR_FIREBASE_API_KEY_HERE',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'YOUR_FIREBASE_AUTH_DOMAIN_HERE',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'YOUR_FIREBASE_PROJECT_ID_HERE',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'YOUR_FIREBASE_STORAGE_BUCKET_HERE',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': 'YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE',
  'NEXT_PUBLIC_FIREBASE_APP_ID': 'YOUR_FIREBASE_APP_ID_HERE',
  'SENDGRID_API_KEY': 'YOUR_SENDGRID_API_KEY_HERE',
  'SENDGRID_FROM_EMAIL': 'YOUR_SENDGRID_FROM_EMAIL_HERE'
};

console.log('Environment variables to set:');
Object.keys(envVars).forEach(key => {
  console.log(`  ${key} = ${envVars[key].substring(0, 20)}...`);
});

console.log('\nTo set these in Vercel:');
console.log('1. Visit: https://vercel.com/accounts/profile/dashboard');
console.log('2. Go to your "alert" project');
console.log('3. Click Settings → Environment Variables');
console.log('4. Add each variable:\n');

Object.keys(envVars).forEach(key => {
  console.log(`Name: ${key}`);
  console.log(`Value: ${envVars[key]}`);
  console.log('Environment: Production\n');
});
