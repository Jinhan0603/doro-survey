import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeSession } from '../firebase/sessions';
import type { SessionDoc } from '../firebase/types';

type UseSessionResult = {
  session: SessionDoc | null;
  loading: boolean;
  error: string | null;
};

export function useSession(sessionId: string, { enabled = true } = {}): UseSessionResult {
  const shouldSubscribe = enabled && firebaseConfigStatus.isConfigured;

  const [state, setState] = useState<UseSessionResult>({
    session: null,
    loading: shouldSubscribe,
    error: null,
  });

  useEffect(() => {
    if (!shouldSubscribe) {
      setState({ session: null, loading: false, error: null });
      return undefined;
    }

    // Mark as loading when (re-)subscribing
    setState((prev) => ({ ...prev, loading: true, error: null }));

    return subscribeSession(
      sessionId,
      (session) => setState({ session, loading: false, error: null }),
      (error) => setState({ session: null, loading: false, error: error.message }),
    );
  }, [sessionId, shouldSubscribe]);

  if (!shouldSubscribe) {
    return { session: null, loading: false, error: null };
  }

  return state;
}
