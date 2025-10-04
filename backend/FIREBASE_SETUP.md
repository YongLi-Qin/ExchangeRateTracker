# Firebase Service Account Setup

To enable Firebase Admin SDK in the backend, you need to create a service account key:

## Steps:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `exchangeratetracker`
3. Go to Project Settings (gear icon)
4. Click on "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Rename it to `firebase-service-account.json`
8. Place it in the `/backend` directory

## Important Security Notes:

- Never commit the service account key to version control
- Add `firebase-service-account.json` to your `.gitignore` file
- Keep the key file secure and do not share it

## File Structure:

```
backend/
├── firebase-service-account.json  # Your actual service account key (DO NOT COMMIT)
├── firebase-service-account-template.json  # Template file for reference
├── check_exchange_rates.py
└── requirements.txt
```

## Fallback Mode:

If no service account key is found, the backend will still work but will fall back to using the local JSON file for alert storage instead of Firestore. The Firebase authentication will also be disabled in this case.

## Testing:

After adding the service account key:
1. Restart the backend server
2. You should see "Firebase Admin SDK initialized with service account" in the logs
3. The backend will now use Firestore for alert storage and Firebase Auth for API protection