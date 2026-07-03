import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type { QuestionDoc } from './types';

function getQuestionsCollection(db: Firestore, sessionId: string) {
  return collection(db, 'sessions', sessionId, 'questions');
}

function getQuestionRef(db: Firestore, sessionId: string, questionId: string) {
  return doc(db, 'sessions', sessionId, 'questions', questionId);
}

export function subscribeQuestions(
  sessionId: string,
  callback: (questions: QuestionDoc[]) => void,
  onError?: (error: Error) => void,
  // 기본은 발표자(default) db. /student는 보조(student) db를 넘겨 인증 인스턴스를 분리한다.
  db: Firestore = requireDb(),
): Unsubscribe {
  const questionsQuery = query(getQuestionsCollection(db, sessionId), orderBy('order', 'asc'));

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
  db: Firestore = requireDb(),
): Unsubscribe {
  return onSnapshot(getQuestionRef(db, sessionId, questionId), (snapshot) => {
    callback(snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as QuestionDoc) : null);
  });
}
