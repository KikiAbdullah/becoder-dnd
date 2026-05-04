# 🔥 Firebase Setup Guide for Chrono-Dungeon

## 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the steps.

## 2. Enable Realtime Database
1. Go to **Build** > **Realtime Database**.
2. Click **Create Database**.
3. Choose a location and start in **Locked mode**.

## 3. Configure Security Rules
1. In Realtime Database, go to the **Rules** tab.
2. Replace existing rules with content from `firebase_rules.txt`.

## 4. Enable Authentication
1. Go to **Build** > **Authentication**.
2. Enable **Anonymous** sign-in (for easy player onboarding).

## 5. Get Config
1. Go to **Project settings** (gear icon).
2. Under **Your apps**, click the `</>` icon to register a web app.
3. Copy the `firebaseConfig` object to your `.env` file.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
```