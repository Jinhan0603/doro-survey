import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeQuestions } from '../firebase/questions';
import type { QuestionDoc } from '../firebase/types';

type UseQuestionsResult = {
  questions: QuestionDoc[];
  loading: boolean;
  error: string | null;
};

export function useQuestions(sessionId: string, { enabled = true } = {}): UseQuestionsResult {
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

    return subscribeQuestions(sessionId, (questions) => {
      setState({ questions, loading: false, error: null });
    });
  }, [sessionId, shouldSubscribe]);

  if (!shouldSubscribe) {
    return { questions: [], loading: false, error: null };
  }

  return state;
}
