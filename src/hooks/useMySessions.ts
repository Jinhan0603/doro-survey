import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeMySessions, type SessionSummary } from '../firebase/sessions';

type UseMySessionsResult = {
  sessions: SessionSummary[];
  loading: boolean;
  error: string | null;
};

/** Live list of the sessions owned by the given presenter. */
export function useMySessions(ownerUid: string | null | undefined): UseMySessionsResult {
  const enabled = firebaseConfigStatus.isConfigured && Boolean(ownerUid);
  const [state, setState] = useState<UseMySessionsResult>({
    sessions: [],
    loading: enabled,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !ownerUid) {
      setState({ sessions: [], loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    return subscribeMySessions(
      ownerUid,
      (sessions) => setState({ sessions, loading: false, error: null }),
      (error) => setState({ sessions: [], loading: false, error: error.message }),
    );
  }, [enabled, ownerUid]);

  return state;
}
