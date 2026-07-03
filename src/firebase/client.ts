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

// 학생(/student) 전용 보조 인스턴스. 익명 학생 로그인이 발표자(default app)의 currentUser를
// 덮어쓰지 않도록 별도 이름의 Firebase app으로 분리한다. 같은 origin이지만 app 이름이 다르면
// Auth persistence 키도 분리돼, 발표자 세션과 학생 익명 세션이 서로 간섭하지 않는다.
const STUDENT_APP_NAME = 'student';
let studentApp: FirebaseApp | null = null;
let studentAuth: Auth | null = null;
let studentDb: Firestore | null = null;

if (firebaseConfigStatus.isConfigured) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  studentApp =
    getApps().find((existing) => existing.name === STUDENT_APP_NAME) ??
    initializeApp(firebaseConfig, STUDENT_APP_NAME);
  studentAuth = getAuth(studentApp);
  studentDb = getFirestore(studentApp);
}

export { app, auth, db, studentApp, studentAuth, studentDb };
export const defaultSessionId = import.meta.env.VITE_DEFAULT_SESSION_ID?.trim() || 'doro-tech-class-2026';
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

export function requireStudentDb() {
  if (!studentDb) {
    throw new Error(
      firebaseConfigStatus.message ??
        'Firebase Firestore(student)가 초기화되지 않았습니다. .env.local 설정을 먼저 확인해주세요.',
    );
  }

  return studentDb;
}

export function requireStudentAuth() {
  if (!studentAuth) {
    throw new Error(
      firebaseConfigStatus.message ??
        'Firebase Authentication(student)이 초기화되지 않았습니다. .env.local 설정을 먼저 확인해주세요.',
    );
  }

  return studentAuth;
}
