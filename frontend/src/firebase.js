import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCM1HaSLRXiwL5oi7tQzwWJ2onhEgsWuIc",
  authDomain: "agrisense-1d0b3.firebaseapp.com",
  projectId: "agrisense-1d0b3",
  storageBucket: "agrisense-1d0b3.firebasestorage.app",
  messagingSenderId: "503163669221",
  appId: "1:503163669221:web:d1e880cf00001c1c5ea20c",
  measurementId: "G-QK68YCCBY1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
