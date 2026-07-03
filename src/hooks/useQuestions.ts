import { useEffect, useState } from 'react';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeQuestions } from '../firebase/questions';
import type { QuestionDoc } from '../firebase/types';

type UseQuestionsResult = {
  questions: QuestionDoc[];
  loading: boolean;
  error: string | null;
};

// db를 넘기면 그 Firestore 인스턴스로 구독한다(예: /student는 보조 studentDb). 기본은 default db.
export function useQuestions(
  sessionId: string,
  { enabled = true, db }: { enabled?: boolean; db?: Firestore } = {},
): UseQuestionsResult {
  const shouldSubscribe = enabled && firebaseConfigStatus.isConfigured;

  const [state, setState] = useState<UseQuestionsResult>({
    questions: [],
    loading: shouldSubscribe,
    error: null,
  });

  useEffect(() => {
    if (!shouldSubscribe) {
      setState({ questions: [], loading: false, error: null });
      return undefined;
    }

    // Mark as loading when (re-)subscribing
    setState((prev) => ({ ...prev, loading: true, error: null }));

    return subscribeQuestions(
      sessionId,
      (questions) => setState({ questions, loading: false, error: null }),
      (error) => setState({ questions: [], loading: false, error: error.message }),
      db,
    );
  }, [sessionId, shouldSubscribe, db]);

  if (!shouldSubscribe) {
    return { questions: [], loading: false, error: null };
  }

  return state;
}
