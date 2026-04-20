import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeQuestions } from '../firebase/questions';
import type { QuestionDoc } from '../firebase/types';

type UseQuestionsResult = {
  questions: QuestionDoc[];
  loading: boolean;
  error: string | null;
};

export function useQuestions(sessionId: string): UseQuestionsResult {
  const [state, setState] = useState<UseQuestionsResult>({
    questions: [],
    loading: firebaseConfigStatus.isConfigured,
    error: null,
  });

  useEffect(() => {
    if (!firebaseConfigStatus.isConfigured) {
      return undefined;
    }

    return subscribeQuestions(sessionId, (questions) => {
      setState((current) => ({
        questions,
        loading: false,
        error: current.error,
      }));
    });
  }, [sessionId]);

  if (!firebaseConfigStatus.isConfigured) {
    return {
      questions: [],
      loading: false,
      error: null,
    };
  }

  return state;
}
