/**
 * Presenter-side auth for DORO Live Survey.
 *
 * Orchestrates: DoroGate(Keycloak) OIDC login -> exchange the access token for a
 * Firebase custom token (exchangeToken function) -> signInWithCustomToken. The
 * resulting Firebase user carries a `role` claim used by Firestore rules.
 *
 * This is separate from the generic Firebase `useAuth` used by the /student
 * (anonymous) flow, which is intentionally left untouched.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { firebaseConfigStatus } from '../firebase/client';
import { signInWithDoroGateToken, signOutUser, subscribeAuthState } from '../firebase/auth';
import {
  authExchangeUrl,
  getUserManager,
  isAuthCallback,
  keycloakConfigStatus,
} from './keycloak';

export type AppRole = 'admin' | 'manager' | 'teacher';

/**
 * disabled  — DoroGate/Firebase env not configured; gate is bypassed (dev/preview)
 * loading   — resolving the OIDC session / exchange
 * anonymous — no presenter session; caller should redirect to DoroGate
 * forbidden — authenticated at DoroGate but role not allowed (e.g. student)
 * authorized — presenter signed in to Firebase with an allowed role
 * error     — unexpected failure during the flow
 */
export type AuthStatus =
  | 'disabled'
  | 'loading'
  | 'anonymous'
  | 'forbidden'
  | 'authorized'
  | 'error';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  role: AppRole | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const gateEnabled = firebaseConfigStatus.isConfigured && keycloakConfigStatus.isConfigured;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(gateEnabled ? 'loading' : 'disabled');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Track the Firebase user/role once signed in.
  useEffect(() => {
    if (!gateEnabled) return undefined;
    return subscribeAuthState(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const token = await nextUser.getIdTokenResult();
        setRole((token.claims.role as AppRole | undefined) ?? null);
      } else {
        setRole(null);
      }
    });
  }, []);

  // Resolve the OIDC session (handling the redirect callback) and exchange it.
  useEffect(() => {
    if (!gateEnabled || startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const manager = getUserManager();
      const oidcUser = isAuthCallback()
        ? await manager.signinRedirectCallback()
        : await manager.getUser();

      if (isAuthCallback()) {
        // Strip the ?code&state query so a reload doesn't re-trigger the callback.
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }

      if (!oidcUser || oidcUser.expired || !oidcUser.access_token) {
        setStatus('anonymous');
        return;
      }

      const response = await fetch(authExchangeUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${oidcUser.access_token}` },
      });

      if (response.status === 403) {
        setStatus('forbidden');
        return;
      }
      if (!response.ok) {
        setError('인증 서버 응답 오류가 발생했습니다.');
        setStatus('error');
        return;
      }

      const { firebaseToken } = (await response.json()) as { firebaseToken: string };
      await signInWithDoroGateToken(firebaseToken);
      setStatus('authorized');
    })().catch((nextError: unknown) => {
      setError(nextError instanceof Error ? nextError.message : '로그인 처리에 실패했습니다.');
      setStatus('error');
    });
  }, []);

  const login = useCallback(async () => {
    await getUserManager().signinRedirect();
  }, []);

  const logout = useCallback(async () => {
    await signOutUser().catch(() => undefined);
    await getUserManager()
      .signoutRedirect()
      .catch(() => undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, role, error, login, logout }),
    [status, user, role, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function usePresenterAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('usePresenterAuth must be used within an AuthProvider');
  }
  return ctx;
}
