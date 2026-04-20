import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type { AnswerDoc, QuestionType } from './types';

type UpsertAnswerInput = {
  sessionId: string;
  questionId: string;
  uid: string;
  nickname: string;
  questionType: QuestionType;
  value: string;
};

type UpdateAnswerModerationInput = {
  sessionId: string;
  questionId: string;
  uid: string;
  approved?: boolean;
  hidden?: boolean;
};

function getAnswersCollection(sessionId: string, questionId: string) {
  return collection(requireDb(), 'sessions', sessionId, 'questions', questionId, 'answers');
}

function getAnswerRef(sessionId: string, questionId: string, uid: string) {
  return doc(requireDb(), 'sessions', sessionId, 'questions', questionId, 'answers', uid);
}

export function subscribeAnswers(
  sessionId: string,
  questionId: string,
  callback: (answers: AnswerDoc[]) => void,
): Unsubscribe {
  const answersQuery = query(getAnswersCollection(sessionId, questionId), orderBy('updatedAt', 'desc'));

  return onSnapshot(answersQuery, (snapshot) => {
    callback(snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as AnswerDoc));
  });
}

export function subscribeOwnAnswer(
  sessionId: string,
  questionId: string,
  uid: string,
  callback: (answer: AnswerDoc | null) => void,
): Unsubscribe {
  return onSnapshot(getAnswerRef(sessionId, questionId, uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as AnswerDoc) : null);
  });
}

export async function upsertAnswer({
  sessionId,
  questionId,
  uid,
  nickname,
  questionType,
  value,
}: UpsertAnswerInput) {
  const answerRef = getAnswerRef(sessionId, questionId, uid);
  const existing = await getDoc(answerRef);
  const trimmedNickname = nickname.trim();
  const trimmedValue = value.trim();

  const basePayload: Omit<AnswerDoc, 'createdAt' | 'updatedAt'> = {
    uid,
    nickname: trimmedNickname,
    answer: questionType === 'choice' ? trimmedValue : null,
    answerText: questionType === 'text' ? trimmedValue : null,
    approved: false,
    hidden: false,
  };

  if (existing.exists()) {
    await updateDoc(answerRef, {
      ...basePayload,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(answerRef, {
    ...basePayload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAnswerModeration({
  sessionId,
  questionId,
  uid,
  approved,
  hidden,
}: UpdateAnswerModerationInput) {
  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof approved === 'boolean') {
    patch.approved = approved;
  }

  if (typeof hidden === 'boolean') {
    patch.hidden = hidden;
  }

  await updateDoc(getAnswerRef(sessionId, questionId, uid), patch);
}
