import { useEffect, useState } from 'react';
import type { Firestore } from 'firebase/firestore';
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

    setState((current) => ({ ...current, loading: true, error: null }));

    return subscribeAnswers(
      sessionId,
      questionId,
      (answers) => {
        setState({
          answers,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState((current) => ({
          answers: current.answers,
          loading: false,
          error: error.message,
        }));
      },
    );
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

/**
 * 여러 질문에 대한 학생 본인 답변을 한꺼번에 구독한다(질문별 리스너).
 * 리스트 화면에서 각 질문의 '제출완료' 여부 판단에 쓴다. 반환은 questionId → 답변 맵.
 */
export function useOwnAnswers(
  sessionId: string,
  questionIds: string[],
  uid: string | null | undefined,
  // 기본은 발표자(default) db. /student는 보조(student) db를 넘겨 익명 학생 신원으로 구독한다.
  db?: Firestore,
): Record<string, AnswerDoc | null> {
  const [answers, setAnswers] = useState<Record<string, AnswerDoc | null>>({});
  const key = questionIds.join('|');

  useEffect(() => {
    if (!firebaseConfigStatus.isConfigured || !uid || questionIds.length === 0) {
      setAnswers({});
      return undefined;
    }

    const unsubscribers = questionIds.map((questionId) =>
      subscribeOwnAnswer(
        sessionId,
        questionId,
        uid,
        (answer) => setAnswers((current) => ({ ...current, [questionId]: answer })),
        () => {},
        db,
      ),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    // key(=questionIds 조합)로 질문 집합 변화를 감지한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, uid, key, db]);

  return answers;
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

    setState((current) => ({ ...current, loading: true, error: null }));

    return subscribeOwnAnswer(
      sessionId,
      questionId,
      uid,
      (answer) => {
        setState({
          answer,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState((current) => ({
          answer: current.answer,
          loading: false,
          error: error.message,
        }));
      },
    );
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
