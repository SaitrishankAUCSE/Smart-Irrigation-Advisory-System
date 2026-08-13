# Smart Irrigation Advisory System

## Architecture Overview
This is a full-stack application composed of:
- **Frontend**: React (Vite) + Tailwind CSS + Recharts
- **Backend**: Firebase Cloud Functions (Python Gen 2)
- **Database**: Firebase Firestore (NoSQL)
- **Auth**: Firebase Authentication with Custom Claims (farmer/admin)

## Key Design Decisions
- **Rule-based Engine vs ML**: A rule-based engine is transparent, easy to adjust by agronomists (admins), and requires zero training data to get started, making it ideal for immediate deployment for small farmers.
- **Firebase Firestore**: We chose Firestore over SQLite to easily sync data across devices in real-time, handle offline capabilities in the future, and seamlessly integrate with Firebase Authentication and Cloud Functions in a single ecosystem.
- **Python Cloud Functions**: Chosen for the backend to allow future integration with Python-based data science libraries (like pandas for analytics) while maintaining a clean, serverless architecture.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Firebase Project Setup
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore**, **Authentication** (Email/Password), and **Cloud Functions**.
3. Run `firebase login` and `firebase use <YOUR_PROJECT_ID>`.

### 2. Backend Setup
```bash
cd functions
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Running Locally (Emulators)
Open two terminal windows.
Terminal 1 (Firebase Emulators):
```bash
firebase emulators:start --project demo-project
```
Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
Note: Ensure `VITE_USE_EMULATOR=true` is set or hardcoded in `src/firebase.js` (currently enabled for local dev).

### 5. Seeding the Database
To populate the `crop_stage_rules` and a demo farmer account:
```bash
cd functions
# Ensure FIRESTORE_EMULATOR_HOST is set to localhost:8080
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"
python seed.py
```

### 6. Environment Variables
To enable real OpenWeatherMap API, set the key in the Cloud Functions environment (not yet implemented in demo mock, but architecture supports it):
`firebase functions:secrets:set WEATHER_API_KEY`
