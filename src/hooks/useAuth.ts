import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeStudentAuthState } from '../firebase/auth';

type UseAuthResult = {
  user: User | null;
  loading: boolean;
};

/**
 * /student 전용 인증 훅. 보조(student) Firebase app의 익명 세션을 구독한다.
 * 발표자(default app) 세션과 분리돼 있어 서로 덮어쓰지 않는다.
 */
export function useAuth(): UseAuthResult {
  const [state, setState] = useState<UseAuthResult>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = subscribeStudentAuthState((user) => {
      setState({
        user,
        loading: false,
      });
    });

    return unsubscribe;
  }, []);

  return state;
}
