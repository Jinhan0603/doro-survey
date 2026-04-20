import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { subscribeAnswers, subscribeOwnAnswer } from '../firebase/answers';
import type { AnswerDoc } from '../firebase/types';

type UseAnswersResult = {
  answers: AnswerDoc[];
  loading: boolean;
  error: string | null;
};

type UseOwnAnswerResult = {
  answer: AnswerDoc | null;
  loading: boolean;
  error: string | null;
};

export function useAnswers(sessionId: string, questionId: string | null | undefined): UseAnswersResult {
  const [state, setState] = useState<UseAnswersResult>({
    answers: [],
    loading: firebaseConfigStatus.isConfigured && Boolean(questionId),
    error: null,
  });

  useEffect(() => {
    if (!firebaseConfigStatus.isConfigured || !questionId) {
      return undefined;
    }

    return subscribeAnswers(sessionId, questionId, (answers) => {
      setState((current) => ({
        answers,
        loading: false,
        error: current.error,
      }));
    });
  }, [questionId, sessionId]);

  if (!firebaseConfigStatus.isConfigured || !questionId) {
    return {
      answers: [],
      loading: false,
      error: null,
    };
  }

  return state;
}

export function useOwnAnswer(
  sessionId: string,
  questionId: string | null | undefined,
  uid: string | null | undefined,
): UseOwnAnswerResult {
  const [state, setState] = useState<UseOwnAnswerResult>({
    answer: null,
    loading: firebaseConfigStatus.isConfigured && Boolean(questionId) && Boolean(uid),
    error: null,
  });

  useEffect(() => {
    if (!firebaseConfigStatus.isConfigured || !questionId || !uid) {
      return undefined;
    }

    return subscribeOwnAnswer(sessionId, questionId, uid, (answer) => {
      setState((current) => ({
        answer,
        loading: false,
        error: current.error,
      }));
    });
  }, [questionId, sessionId, uid]);

  if (!firebaseConfigStatus.isConfigured || !questionId || !uid) {
    return {
      answer: null,
      loading: false,
      error: null,
    };
  }

  return state;
}
