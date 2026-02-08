# Set Vercel environment variables
Write-Host "Setting Firebase and SendGrid environment variables in Vercel..."

# Firebase Config
$envVars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyCMUqMBkq5EaXDUMzBLjMsSvNiRhjAaWok"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "chainalert-39b42.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "chainalert-39b42"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "chainalert-39b42.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "394527278566"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:394527278566:web:59ad19e63261b723ea8227"
    "SENDGRID_API_KEY" = "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"
    "SENDGRID_FROM_EMAIL" = "ChainAlert <tnashe.zw@gmail.com>"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..."
    # Use echo to provide 'Leave as is' response (first option)
    echo "" | npx vercel env add $key $value 2>&1 | Select-Object -First 5
}

Write-Host "Done!"
