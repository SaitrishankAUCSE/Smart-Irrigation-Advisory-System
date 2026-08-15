import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACblziPPOuFUL7OuLUEVj2W5jpsLPFDD0",
  authDomain: "agrisense-d13b2.firebaseapp.com",
  projectId: "agrisense-d13b2",
  storageBucket: "agrisense-d13b2.firebasestorage.app",
  messagingSenderId: "961294081725",
  appId: "1:961294081725:web:341e11c7ef92f0829a61d4",
  measurementId: "G-5MFN8HWE9K"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
