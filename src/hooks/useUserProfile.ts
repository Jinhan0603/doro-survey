import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeCurrentUserProfile, DEFAULT_ORGANIZATION_ID } from '../firebase/users';
import type { UserProfileDoc } from '../firebase/types';

type UseUserProfileResult = {
  profile: UserProfileDoc | null;
  loading: boolean;
};

export function useUserProfile(uid: string | null | undefined): UseUserProfileResult {
  const [state, setState] = useState<UseUserProfileResult>({
    profile: null,
    loading: firebaseConfigStatus.isConfigured && Boolean(uid),
  });

  useEffect(() => {
    if (!firebaseConfigStatus.isConfigured || !uid) {
      setState({ profile: null, loading: false });
      return;
    }

    return subscribeCurrentUserProfile(uid, (profile) => {
      setState({
        profile: profile
          ? {
              ...profile,
              organizationId: profile.organizationId ?? DEFAULT_ORGANIZATION_ID,
            }
          : null,
        loading: false,
      });
    });
  }, [uid]);

  return state;
}
