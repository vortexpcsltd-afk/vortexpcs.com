import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Type assertion for Vite environment variables
const env = import.meta.env as any;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: env.VITE_FIREBASE_APP_ID as string,
};

const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

let app: any = undefined;
let auth: any = undefined;
let db: any = undefined;
let storage: any = undefined;
let googleProvider: any = undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase not configured");
}

export { auth, db, storage, googleProvider, app };
export default app;
