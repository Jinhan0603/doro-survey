import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { requireDb } from './client';
import type { UserProfileDoc } from './types';

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

export function isAdminRole(profile: UserProfileDoc | null): boolean {
  return profile?.role === 'admin';
}

export function isTeacherRole(profile: UserProfileDoc | null): boolean {
  return profile?.role === 'teacher' || profile?.role === 'admin';
}
