/**
 * DoroGate (Keycloak) OIDC client configuration for the presenter app.
 *
 * Uses Authorization Code + PKCE via a public client. The SPA logs in against
 * DoroGate, then exchanges the resulting access token for a Firebase custom
 * token (see AuthProvider). Students never reach this flow — they use the
 * participation link which keeps anonymous Firebase auth.
 */
import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

const issuer = import.meta.env.VITE_KEYCLOAK_ISSUER?.trim() ?? '';
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() ?? '';
const exchangeUrl = import.meta.env.VITE_AUTH_EXCHANGE_URL?.trim() ?? '';

export const keycloakConfigStatus = {
  isConfigured: Boolean(issuer && clientId && exchangeUrl),
  missingKeys: [
    ['VITE_KEYCLOAK_ISSUER', issuer],
    ['VITE_KEYCLOAK_CLIENT_ID', clientId],
    ['VITE_AUTH_EXCHANGE_URL', exchangeUrl],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key),
};

export const authExchangeUrl = exchangeUrl;

/**
 * The OIDC redirect target. The app uses HashRouter, so the authorization-code
 * response lands on the base URL (before the hash); AuthProvider detects the
 * `code`/`state` query params on load and completes the sign-in.
 */
function redirectUri() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}

const settings: UserManagerSettings = {
  authority: issuer,
  client_id: clientId,
  redirect_uri: redirectUri(),
  post_logout_redirect_uri: redirectUri(),
  response_type: 'code',
  scope: 'openid profile email',
  loadUserInfo: true,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

let manager: UserManager | null = null;

export function getUserManager(): UserManager {
  if (!keycloakConfigStatus.isConfigured) {
    throw new Error(
      `DoroGate 설정이 비어 있습니다. 다음 환경변수를 채워주세요: ${keycloakConfigStatus.missingKeys.join(', ')}`,
    );
  }
  if (!manager) {
    manager = new UserManager(settings);
  }
  return manager;
}

/** Whether the current URL is an OIDC authorization-code callback. */
export function isAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('code') && params.has('state');
}
