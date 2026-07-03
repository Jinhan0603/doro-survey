import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signOut,
  type AuthError,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { auth, getFirebaseConfigError, requireStudentAuth, studentAuth } from './client';

function requireAuth() {
  if (!auth) {
    throw new Error(
      getFirebaseConfigError() ??
        'Firebase Authentication이 초기화되지 않았습니다. .env.local 설정을 먼저 확인해주세요.',
    );
  }

  return auth;
}

function formatAuthError(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const authError = error as AuthError;
    return `${fallback}: ${authError.code}`;
  }

  if (error instanceof Error) {
    return `${fallback}: ${error.message}`;
  }

  return fallback;
}

export async function signInStudentAnonymously() {
  try {
    // 학생 익명 로그인은 반드시 보조(student) auth에서 수행한다. default auth를 쓰면 같은
    // 브라우저의 발표자(DoroGate) 세션을 익명으로 덮어써 발표자 write가 전부 권한 거부된다.
    return await signInAnonymously(requireStudentAuth());
  } catch (error) {
    throw new Error(
      formatAuthError(error, '학생 익명 로그인에 실패했습니다. Firebase Anonymous Auth 설정을 확인해주세요.'),
    );
  }
}

export async function signInWithDoroGateToken(firebaseToken: string) {
  try {
    return await signInWithCustomToken(requireAuth(), firebaseToken);
  } catch (error) {
    throw new Error(
      formatAuthError(error, 'DoroGate 로그인 후 Firebase 인증에 실패했습니다.'),
    );
  }
}

export async function signOutUser() {
  try {
    return await signOut(requireAuth());
  } catch (error) {
    throw new Error(formatAuthError(error, '로그아웃에 실패했습니다.'));
  }
}

export function subscribeAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(auth, callback);
}

/** 보조(student) auth의 상태를 구독한다. /student 화면 전용 — 발표자 default auth와 분리. */
export function subscribeStudentAuthState(callback: (user: User | null) => void): Unsubscribe {
  if (!studentAuth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(studentAuth, callback);
}
