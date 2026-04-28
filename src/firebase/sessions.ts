import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { seedQuestions } from '../data/seedQuestions';
import { defaultSessionId, requireDb } from './client';
import type { SeedQuestion, SessionDoc } from './types';

export const DEFAULT_SESSION_TITLE = 'DORO 기술 실습 수업';

function getSessionRef(sessionId: string) {
  return doc(requireDb(), 'sessions', sessionId);
}

function getQuestionRef(sessionId: string, questionId: string) {
  return doc(requireDb(), 'sessions', sessionId, 'questions', questionId);
}

export function subscribeSession(
  sessionId: string,
  callback: (session: SessionDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    getSessionRef(sessionId),
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as SessionDoc) : null);
    },
    (error) => onError?.(error),
  );
}

export async function updateSession(
  sessionId: string,
  patch: Partial<Pick<SessionDoc, 'activeQuestionId' | 'accepting' | 'showResults' | 'title'>>,
) {
  await updateDoc(getSessionRef(sessionId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function setActiveQuestionId(sessionId: string, questionId: string) {
  await updateSession(sessionId, { activeQuestionId: questionId });
}

export async function seedSession(
  sessionId = defaultSessionId,
  title = DEFAULT_SESSION_TITLE,
  questions: SeedQuestion[] = seedQuestions,
  owner?: {
    uid?: string;
    organizationId?: string;
  },
) {
  const database = requireDb();
  const batch = writeBatch(database);
  const activeQuestionId = questions[0]?.id ?? null;

  batch.set(
    getSessionRef(sessionId),
    {
      title,
      activeQuestionId,
      accepting: false,
      showResults: false,
      ownerUid: owner?.uid ?? null,
      organizationId: owner?.organizationId ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  questions.forEach((question) => {
    batch.set(
      getQuestionRef(sessionId, question.id),
      {
        ...question,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
}
