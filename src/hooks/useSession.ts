import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeSession } from '../firebase/sessions';
import type { SessionDoc } from '../firebase/types';

type UseSessionResult = {
  session: SessionDoc | null;
  loading: boolean;
  error: string | null;
};

export function useSession(sessionId: string): UseSessionResult {
  const [state, setState] = useState<UseSessionResult>({
    session: null,
    loading: firebaseConfigStatus.isConfigured,
    error: null,
  });

  useEffect(() => {
    if (!firebaseConfigStatus.isConfigured) {
      return undefined;
    }

    return subscribeSession(sessionId, (session) => {
      setState((current) => ({
        session,
        loading: false,
        error: current.error,
      }));
    });
  }, [sessionId]);

  if (!firebaseConfigStatus.isConfigured) {
    return {
      session: null,
      loading: false,
      error: null,
    };
  }

  return state;
}
