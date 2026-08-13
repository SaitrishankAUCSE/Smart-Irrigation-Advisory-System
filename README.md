# 🌱 AgriSense: Smart Irrigation Advisory System

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://smart-irrigation-advisory.vercel.app/)
[![Hackathon](https://img.shields.io/badge/Codegnan-Hackathon_2026-green?style=for-the-badge)](https://smart-irrigation-advisory.vercel.app/)

A full-stack intelligent irrigation advisory platform built for the **Codegnan Hackathon 2026** by team **Quantum Coders**.

AgriSense helps smallholder farmers optimize their water usage by providing precise, actionable irrigation recommendations based on real-time soil moisture data, weather forecasts, and crop-specific growth stage requirements.

---

## 🏗️ Architecture & Tech Stack

Our application is a modern, serverless architecture designed for scale, speed, and reliability. It strictly follows the hackathon requirements:

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS & Lucide Icons for a clean, premium, accessible user interface.
- **Analytics Visualization**: Recharts for rendering water usage trends and adherence metrics.

### Backend (Advisory Engine)
- **Framework**: Python FastAPI (Deployed as a Vercel Serverless Function)
- **Business Logic**: Pure Python recommendation engine that calculates a `deficit_factor` based on current moisture, crop stage thresholds, and expected rainfall probability to recommend precise water volumes.
- **Why no Pandas?**: We actively optimized the analytics engine to run in pure Python, bypassing the massive memory footprint of Pandas, ensuring lightning-fast Serverless cold starts.

### Database & Security
- **Database**: Firebase Firestore (NoSQL) with strict relational schemas (`fields/{id}/moistureReadings`, `fields/{id}/irrigationLogs`).
- **Authentication**: Firebase Auth (Email/Password) with secure JWT bearer token validation on all API endpoints.

---

## ⚙️ Key Design Decisions

1. **Vercel Serverless Backend**: To eliminate the complexity of hosting 3rd party Python servers (like Render) or paying for Firebase Cloud Functions (Blaze Plan), we engineered the FastAPI backend to run directly inside Vercel's Python Serverless infrastructure (`/api`). This provides a seamless, zero-CORS full-stack deployment.
2. **Dynamic UI/UX**: We built a fully responsive dashboard that immediately reacts to backend advisory logic, preventing farmers from over-irrigating when high rain probability is detected.
3. **Analytics Adherence Tracking**: The system tracks whether a farmer actually followed the AI recommendation, allowing for long-term water usage optimization and behavior analysis.

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Node.js (v18+)
- Python 3.9+
- Firebase CLI (`npm install -g firebase-tools`)

### 2. Database (Firebase Emulators)
We use the Firebase Local Emulator Suite for isolated local database testing.
```bash
firebase emulators:start
```

### 3. Backend (FastAPI)
Open a new terminal and start the Python engine:
```bash
cd api
pip install -r requirements.txt
uvicorn index:app --reload
```

### 4. Frontend (React)
Open a third terminal to start the UI:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`. 

*(Note: In local development, the React Vite server automatically proxies `/api` requests to the local Python FastAPI instance at `localhost:8000`).*

---

### Demo Credentials
To explore the live application:
- **Email**: `demo.farmer@example.com`
- **Password**: `password123`

---
*Built with ❤️ by Quantum Coders*
