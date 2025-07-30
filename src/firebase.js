import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Local testing configuration
const localFirebaseConfig = {
  apiKey: "AIzaSyDRMUag85s9OZeDFPcKnvafxavFtOPFITU",
  authDomain: "task-local-cc1b1.firebaseapp.com",
  projectId: "task-local-cc1b1",
  storageBucket: "task-local-cc1b1.firebasestorage.app",
  messagingSenderId: "146478096862",
  appId: "1:146478096862:web:3666c564d4e48f6daf7d4f",
  measurementId: "G-Y045DEZFYT"
};

// Production configuration using environment variables
const productionFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Use local config for development, production config for production
const firebaseConfig = import.meta.env.DEV ? localFirebaseConfig : productionFirebaseConfig;

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app); 
export const auth = getAuth(app); 