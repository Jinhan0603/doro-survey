import { useEffect, useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeSession } from '../firebase/sessions';
import type { SessionDoc } from '../firebase/types';

type UseSessionResult = {
  session: SessionDoc | null;
  loading: boolean;
  error: string | null;
};

// db를 넘기면 그 Firestore 인스턴스로 구독한다(예: /student는 보조 studentDb). 기본은 default db.
export function useSession(
  sessionId: string,
  { enabled = true, db }: { enabled?: boolean; db?: Firestore } = {},
): UseSessionResult {
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
      db,
    );
  }, [sessionId, shouldSubscribe, db]);

  if (!shouldSubscribe) {
    return { session: null, loading: false, error: null };
  }

  return state;
}
