# Set Vercel environment variables
Write-Host "Setting Firebase and SendGrid environment variables in Vercel..."
Write-Host "Update the values below with your actual credentials from Firebase Console and SendGrid"
Write-Host ""

# Firebase Config
$envVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "YOUR_FIREBASE_API_KEY_HERE"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "YOUR_FIREBASE_AUTH_DOMAIN_HERE"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "YOUR_FIREBASE_PROJECT_ID_HERE"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "YOUR_FIREBASE_STORAGE_BUCKET_HERE"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "YOUR_FIREBASE_APP_ID_HERE"
    "SENDGRID_API_KEY" = "YOUR_SENDGRID_API_KEY_HERE"
    "SENDGRID_FROM_EMAIL" = "YOUR_SENDGRID_FROM_EMAIL_HERE"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..."
    # Use echo to provide 'Leave as is' response (first option)
    echo "" | npx vercel env add $key $value 2>&1 | Select-Object -First 5
}

Write-Host "Done!"
