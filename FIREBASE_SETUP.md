# Firebase Setup Instructions

## 1. Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create a project" (or "Add project")
3. Name it: "little-league-app" (or your preferred name)
4. Disable Google Analytics (not needed for this app)
5. Click "Create Project"

## 2. Enable Firestore Database
1. In Firebase Console, click "Firestore Database" in left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (we'll add rules next)
4. Select your nearest location
5. Click "Enable"

## 3. Set Database Rules
1. Go to Firestore Database → Rules tab
2. Replace the rules with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /games/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click "Publish"

## 4. Enable Authentication
1. Click "Authentication" in left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" (for quick start)
5. Optionally enable "Google" for sign-in with Google account

## 5. Get Your Config
1. Click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click "</>" (Web) icon
4. Register app with nickname "Little League App"
5. Copy the firebaseConfig object

## 6. Add Your Config to the App
1. Open index.html
2. Find the `firebaseConfig` object (around line 1050)
3. Replace with your config from step 5
4. Save the file

## 7. Add Your Domain to Firebase
1. In Firebase Console → Authentication → Settings → Authorized domains
2. Add your Netlify domain (e.g., your-app.netlify.app)

## That's it! Your app now has cloud storage!

## How It Works:
- **Save**: Automatically saves to Firebase cloud
- **Load**: Shows all your cloud-saved games
- **Share**: Creates a short Game ID like "GAME-ABC123"
- **Sync**: Access your games from any device

## Troubleshooting:
- If saves aren't working, check browser console for errors
- Make sure your domain is in Firebase authorized domains
- Ensure Firestore and Authentication are enabled