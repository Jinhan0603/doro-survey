import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { auth, getFirebaseConfigError } from './client';

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
    return await signInAnonymously(requireAuth());
  } catch (error) {
    throw new Error(
      formatAuthError(error, '학생 익명 로그인에 실패했습니다. Firebase Anonymous Auth 설정을 확인해주세요.'),
    );
  }
}

export async function signInAdminWithEmail(email: string, password: string) {
  try {
    return await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  } catch (error) {
    throw new Error(
      formatAuthError(error, '관리자 로그인에 실패했습니다. 이메일/비밀번호 계정과 인증 설정을 확인해주세요.'),
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
