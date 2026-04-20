import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeAuthState } from '../firebase/auth';

type UseAuthResult = {
  user: User | null;
  loading: boolean;
};

export function useAuth(): UseAuthResult {
  const [state, setState] = useState<UseAuthResult>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      setState({
        user,
        loading: false,
      });
    });

    return unsubscribe;
  }, []);

  return state;
}
