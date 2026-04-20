import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

type FirebaseConfigStatus = {
  isConfigured: boolean;
  missingKeys: string[];
  message: string | null;
};

const firebaseConfig: FirebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() ?? '',
};

const envKeyMap: Record<keyof FirebaseWebConfig, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => envKeyMap[key as keyof FirebaseWebConfig]);

export const firebaseConfigStatus: FirebaseConfigStatus = {
  isConfigured: missingKeys.length === 0,
  missingKeys,
  message:
    missingKeys.length === 0
      ? null
      : `Firebase 설정이 아직 완료되지 않았습니다. 다음 환경변수를 채워주세요: ${missingKeys.join(', ')}`,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigStatus.isConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export const defaultSessionId = import.meta.env.VITE_DEFAULT_SESSION_ID?.trim() || 'robot-startup-2026';
export const appName = import.meta.env.VITE_APP_NAME?.trim() || 'DORO Live Survey';

export function getFirebaseConfigError() {
  return firebaseConfigStatus.message;
}

export function assertFirebaseConfigured() {
  if (!firebaseConfigStatus.isConfigured) {
    throw new Error(firebaseConfigStatus.message ?? 'Firebase 설정이 비어 있습니다.');
  }
}

export function requireDb() {
  if (!db) {
    throw new Error(
      firebaseConfigStatus.message ??
        'Firebase Firestore가 초기화되지 않았습니다. .env.local 설정을 먼저 확인해주세요.',
    );
  }

  return db;
}
