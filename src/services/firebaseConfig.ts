import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyByyJVbxNa08gtwZwiXySX3uoO7AuIicZQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "capstone-f13e9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "capstone-f13e9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "capstone-f13e9.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "539221918260",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:539221918260:web:1c16a12474af2952cc0061",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XHD7MMRNM5"
};

// Initialize Firebase
let app;
let db;
let auth;
let storage;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Create a function to check if Firebase is properly initialized
const isFirebaseInitialized = () => {
  return app !== undefined && db !== undefined && auth !== undefined;
};

export { db, auth, storage, isFirebaseInitialized };
export default app;