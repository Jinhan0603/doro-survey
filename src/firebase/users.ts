import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type { UserProfileDoc, UserRole } from './types';

export const ADMIN_ALLOWLIST_EMAILS = [
  'awe2478223@gmail.com',
  'dorocoltd@doroedu.co.kr',
] as const;

export const DEFAULT_ORGANIZATION_ID = 'dorossaem';

function userRef(uid: string) {
  return doc(requireDb(), 'users', uid);
}

export function subscribeCurrentUserProfile(
  uid: string,
  callback: (profile: UserProfileDoc | null) => void,
): Unsubscribe {
  return onSnapshot(userRef(uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfileDoc) : null);
  });
}

export async function createOrUpdateUserProfile(
  uid: string,
  profile: {
    email: string;
    displayName: string;
    role: UserRole;
    organizationId?: string;
  },
): Promise<void> {
  await setDoc(
    userRef(uid),
    {
      uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      organizationId: profile.organizationId?.trim() || DEFAULT_ORGANIZATION_ID,
      schemaVersion: 2,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function isAdminRole(profile: UserProfileDoc | null): boolean {
  return profile?.role === 'admin';
}

export function isTeacherRole(profile: UserProfileDoc | null): boolean {
  return profile?.role === 'teacher' || profile?.role === 'admin';
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_ALLOWLIST_EMAILS.includes(email.trim().toLowerCase() as (typeof ADMIN_ALLOWLIST_EMAILS)[number]);
}

export function inferRoleFromEmail(email: string | null | undefined): UserRole {
  return isAdminEmail(email) ? 'admin' : 'teacher';
}
