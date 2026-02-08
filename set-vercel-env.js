// set-vercel-env.js
// Script to set Vercel environment variables via API
const https = require('https');

const envVars = {
  'NEXT_PUBLIC_FIREBASE_API_KEY': 'AIzaSyCMUqMBkq5EaXDUMzBLjMsSvNiRhjAaWok',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': 'chainalert-39b42.firebaseapp.com',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'chainalert-39b42',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': 'chainalert-39b42.firebasestorage.app',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': '394527278566',
  'NEXT_PUBLIC_FIREBASE_APP_ID': '1:394527278566:web:59ad19e63261b723ea8227',
  'SENDGRID_API_KEY': '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',
  'SENDGRID_FROM_EMAIL': 'ChainAlert <tnashe.zw@gmail.com>'
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
