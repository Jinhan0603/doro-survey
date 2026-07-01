import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type { QuestionDoc } from './types';

function getQuestionsCollection(sessionId: string) {
  return collection(requireDb(), 'sessions', sessionId, 'questions');
}

function getQuestionRef(sessionId: string, questionId: string) {
  return doc(requireDb(), 'sessions', sessionId, 'questions', questionId);
}

export function subscribeQuestions(
  sessionId: string,
  callback: (questions: QuestionDoc[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const questionsQuery = query(getQuestionsCollection(sessionId), orderBy('order', 'asc'));

  return onSnapshot(
    questionsQuery,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as QuestionDoc));
    },
    (error) => {
      console.error(`[firestore] questions 구독 실패 · session=${sessionId}`, error);
      onError?.(error);
    },
  );
}

export function subscribeQuestion(
  sessionId: string,
  questionId: string,
  callback: (question: QuestionDoc | null) => void,
): Unsubscribe {
  return onSnapshot(getQuestionRef(sessionId, questionId), (snapshot) => {
    callback(snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as QuestionDoc) : null);
  });
}
