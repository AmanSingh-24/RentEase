// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAoJ-pBflXZ202amzcEIJXY57cdwin43zQ",
  authDomain: "rentease-68ddd.firebaseapp.com",
  projectId: "rentease-68ddd",
  storageBucket: "rentease-68ddd.firebasestorage.app",
  messagingSenderId: "708004350601",
  appId: "1:708004350601:web:a0af6a68a487d95a22d458"
};

// Singleton pattern to prevent multiple initializations
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();