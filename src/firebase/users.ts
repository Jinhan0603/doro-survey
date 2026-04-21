import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type { UserProfileDoc, UserRole } from './types';

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
  },
): Promise<void> {
  await setDoc(
    userRef(uid),
    {
      uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
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
