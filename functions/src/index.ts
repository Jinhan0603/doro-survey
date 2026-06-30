/**
 * Auth bridge for DORO Live Survey.
 *
 * Verifies a DoroGate (Keycloak) access token, checks the caller's realm role,
 * and — for teacher/manager/admin — mints a Firebase custom token so the SPA can
 * sign in to Firebase/Firestore. Students (or anyone without an allowed role) are
 * rejected with 403, so the presenter app stays presenter-only.
 *
 * The Firebase uid is derived deterministically from the Keycloak subject
 * (`kc:{sub}`) so ownership (ownerUid) is stable across logins.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { createRemoteJWKSet, jwtVerify } from 'jose';

initializeApp();

const KC_ISSUER = process.env.KC_ISSUER ?? 'https://gate.doroedu.co.kr/realms/doro';
const KC_JWKS_URI = `${KC_ISSUER}/protocol/openid-connect/certs`;
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ?? 'https://survey.doroedu.co.kr,http://localhost:5173'
).split(',').map((origin) => origin.trim()).filter(Boolean);
const DEFAULT_ORGANIZATION_ID = 'dorossaem';

// Realm roles that may access the presenter app, in priority order.
type AppRole = 'admin' | 'manager' | 'teacher';
const ROLE_PRIORITY: AppRole[] = ['admin', 'manager', 'teacher'];

const jwks = createRemoteJWKSet(new URL(KC_JWKS_URI));

type KeycloakClaims = {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
};

function pickRole(roles: string[]): AppRole | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export const exchangeToken = onRequest(
  { region: 'asia-northeast3', cors: ALLOWED_ORIGINS },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'POST만 허용됩니다.' });
      return;
    }

    const accessToken = bearerToken(req.get('authorization'));
    if (!accessToken) {
      res.status(401).json({ error: 'Authorization: Bearer <token> 헤더가 필요합니다.' });
      return;
    }

    let claims: KeycloakClaims;
    try {
      const { payload } = await jwtVerify(accessToken, jwks, { issuer: KC_ISSUER });
      claims = payload as KeycloakClaims;
    } catch (error) {
      logger.warn('Keycloak token verification failed', error);
      res.status(401).json({ error: '유효하지 않은 인증 토큰입니다.' });
      return;
    }

    const sub = claims.sub;
    if (!sub) {
      res.status(401).json({ error: '토큰에 sub 클레임이 없습니다.' });
      return;
    }

    const role = pickRole(claims.realm_access?.roles ?? []);
    if (!role) {
      // Students (and any non-presenter role) land here.
      res.status(403).json({ error: '발표자 권한이 없는 계정입니다.', code: 'forbidden_role' });
      return;
    }

    const uid = `kc:${sub}`;
    const email = claims.email ?? null;
    const displayName = claims.name ?? claims.preferred_username ?? email ?? '사용자';

    try {
      // JIT provisioning: keep the users/{uid} profile in sync with Keycloak.
      await getFirestore()
        .collection('users')
        .doc(uid)
        .set(
          {
            uid,
            email,
            displayName,
            role,
            organizationId: DEFAULT_ORGANIZATION_ID,
            schemaVersion: 2,
            updatedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      const firebaseToken = await getAuth().createCustomToken(uid, {
        role,
        email: email ?? '',
        kcSub: sub,
      });

      res.json({ firebaseToken, role, uid });
    } catch (error) {
      logger.error('Failed to mint Firebase custom token', error);
      res.status(500).json({ error: '토큰 발급에 실패했습니다.' });
    }
  },
);
