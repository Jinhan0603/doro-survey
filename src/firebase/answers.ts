import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type { AnswerDoc, AnswerKind } from './types';

type UpsertAnswerInput = {
  sessionId: string;
  questionId: string;
  uid: string;
  nickname: string;
  answerKind: AnswerKind;
  value?: string | null;
  values?: string[];
  // 선택형 응답이 가리키는 선택지 고유 id(집계용). 단일 선택은 choiceId, 복수 선택은 choiceIds.
  choiceId?: string | null;
  choiceIds?: string[];
  displayAnswer: string;
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
  onError?: (error: Error) => void,
): Unsubscribe {
  const answersQuery = query(getAnswersCollection(sessionId, questionId), orderBy('updatedAt', 'desc'));

  return onSnapshot(
    answersQuery,
    (snapshot) => {
      callback(snapshot.docs.map((documentSnapshot) => documentSnapshot.data() as AnswerDoc));
    },
    (error) => {
      console.error(
        `[firestore] answers 구독 실패 · session=${sessionId} question=${questionId}`,
        error,
      );
      onError?.(error);
    },
  );
}

export function subscribeOwnAnswer(
  sessionId: string,
  questionId: string,
  uid: string,
  callback: (answer: AnswerDoc | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    getAnswerRef(sessionId, questionId, uid),
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as AnswerDoc) : null);
    },
    (error) => {
      console.error(
        `[firestore] 내 답변 구독 실패 · session=${sessionId} question=${questionId} uid=${uid}`,
        error,
      );
      onError?.(error);
    },
  );
}

export async function upsertAnswer({
  sessionId,
  questionId,
  uid,
  nickname,
  answerKind,
  value = null,
  values = [],
  choiceId = null,
  choiceIds = [],
  displayAnswer,
}: UpsertAnswerInput) {
  const answerRef = getAnswerRef(sessionId, questionId, uid);
  const existing = await getDoc(answerRef);
  const trimmedNickname = nickname.trim();
  const trimmedValue = value?.trim() ?? null;
  const trimmedValues = values.map((item) => item.trim()).filter(Boolean);
  const normalizedDisplayAnswer = displayAnswer.trim();

  const legacyAnswer =
    answerKind === 'text'
      ? null
      : answerKind === 'multi'
        ? trimmedValues.join(' | ')
        : trimmedValue;

  const legacyAnswerText = answerKind === 'text' ? trimmedValue : null;

  const basePayload: Omit<AnswerDoc, 'createdAt' | 'updatedAt'> = {
    uid,
    nickname: trimmedNickname,
    answer: legacyAnswer,
    answerText: legacyAnswerText,
    answerKind,
    answerValue: answerKind === 'multi' ? null : trimmedValue,
    answerValues: answerKind === 'multi' ? trimmedValues : null,
    // 텍스트 문항은 선택지 id 없음. 단일/복수 선택형만 각각 id 기록.
    answerChoiceId: answerKind === 'text' || answerKind === 'multi' ? null : choiceId,
    answerChoiceIds: answerKind === 'multi' ? choiceIds : null,
    displayAnswer: normalizedDisplayAnswer,
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
  }).catch(async (error: unknown) => {
    // If two tabs submit the first answer at nearly the same time, the second
    // write can be evaluated as an update after the first create wins.
    await updateDoc(answerRef, {
      ...basePayload,
      updatedAt: serverTimestamp(),
    }).catch(() => {
      throw error;
    });
  });
}

/** 응답 문서를 내려받지 않고 개수만 집계한다(Firestore count 쿼리). */
export async function countAnswersForQuestion(sessionId: string, questionId: string): Promise<number> {
  const snapshot = await getCountFromServer(getAnswersCollection(sessionId, questionId));
  return snapshot.data().count;
}

/** 여러 질문의 응답 수를 한 번에 집계해 questionId→count 맵으로 반환한다. */
export async function countAnswersForQuestions(
  sessionId: string,
  questionIds: string[],
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    questionIds.map(async (questionId) => [questionId, await countAnswersForQuestion(sessionId, questionId)] as const),
  );
  return Object.fromEntries(entries);
}

const BATCH_LIMIT = 400;

export async function deleteAnswersForQuestion(
  sessionId: string,
  questionId: string,
): Promise<number> {
  const db = requireDb();
  const snapshot = await getDocs(getAnswersCollection(sessionId, questionId));
  if (snapshot.empty) return 0;

  const docs = snapshot.docs;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += Math.min(BATCH_LIMIT, docs.length - i);
  }

  return deleted;
}

export async function deleteAnswersForSession(
  sessionId: string,
  questionIds: string[],
): Promise<number> {
  let total = 0;
  for (const questionId of questionIds) {
    total += await deleteAnswersForQuestion(sessionId, questionId);
  }
  return total;
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
