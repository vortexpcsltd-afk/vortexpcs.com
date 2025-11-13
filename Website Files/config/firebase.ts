import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { logger } from "../services/logger";

// Narrowed type for env access (works in Vite and falls back if undefined)
type EnvMap = Record<string, string | undefined>;
const metaEnv =
  (import.meta as unknown as { env?: EnvMap }).env || ({} as EnvMap);
const env = metaEnv as EnvMap;

// Support both Vite (VITE_*) and legacy Next.js style (NEXT_PUBLIC_*) variable prefixes
function pick(...candidates: Array<string | undefined>): string | undefined {
  return candidates.find((v) => v && v.length > 0);
}

const firebaseConfig = {
  apiKey: pick(
    env.VITE_FIREBASE_API_KEY,
    env.NEXT_PUBLIC_FIREBASE_API_KEY
  ) as string,
  authDomain: pick(
    env.VITE_FIREBASE_AUTH_DOMAIN,
    env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  ) as string,
  projectId: pick(
    env.VITE_FIREBASE_PROJECT_ID,
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ) as string,
  storageBucket: pick(
    env.VITE_FIREBASE_STORAGE_BUCKET,
    env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  ) as string,
  messagingSenderId: pick(
    env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ) as string,
  appId: pick(
    env.VITE_FIREBASE_APP_ID,
    env.NEXT_PUBLIC_FIREBASE_APP_ID
  ) as string,
};

const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId;

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
// Use a Firestore type assertion so downstream code doesn't need union handling.
// When Firebase isn't configured, this remains undefined (falsy) but typed as Firestore.
let db: Firestore = undefined as unknown as Firestore;
let storage: FirebaseStorage | undefined = undefined;
let googleProvider: GoogleAuthProvider | undefined = undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    logger.debug("Firebase initialized successfully");
  } catch (error) {
    logger.error("Firebase initialization error:", error);
  }
} else {
  logger.warn("Firebase not configured (missing required env vars)");
}

export { auth, db, storage, googleProvider, app };
export default app;
