import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import { makeChoiceId } from '../utils/questionRuntime';
import type {
  InteractionPurpose,
  InteractionType,
  LessonPhase,
  QuestionInputType,
  ResultVisibility,
  SeedQuestion,
  SessionDoc,
} from './types';

/** A session document plus its document id, for list/dashboard views. */
export type SessionSummary = {
  id: string;
  title: string;
  accepting: boolean;
  showResults: boolean;
  activeQuestionId: string | null;
  createdAt?: Timestamp | null;
};

/** Live list of the sessions owned by a given presenter (newest first). */
export function subscribeMySessions(
  ownerUid: string,
  callback: (sessions: SessionSummary[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const sessionsQuery = query(
    collection(requireDb(), 'sessions'),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    sessionsQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as SessionDoc;
          return {
            id: docSnap.id,
            title: data.title,
            accepting: data.accepting,
            showResults: data.showResults,
            activeQuestionId: data.activeQuestionId,
            createdAt: data.createdAt ?? null,
          };
        }),
      );
    },
    (error) => onError?.(error),
  );
}

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

const DELETE_BATCH_LIMIT = 400;

/**
 * Deletes a session and all of its nested data (each question's answers, then
 * the questions, then the session doc). Allowed for the session owner/admin.
 */
export async function deleteSessionCascade(sessionId: string): Promise<void> {
  const database = requireDb();
  const questionsSnap = await getDocs(collection(database, 'sessions', sessionId, 'questions'));

  for (const questionDoc of questionsSnap.docs) {
    const answersSnap = await getDocs(
      collection(database, 'sessions', sessionId, 'questions', questionDoc.id, 'answers'),
    );
    for (let i = 0; i < answersSnap.docs.length; i += DELETE_BATCH_LIMIT) {
      const batch = writeBatch(database);
      answersSnap.docs.slice(i, i + DELETE_BATCH_LIMIT).forEach((answer) => batch.delete(answer.ref));
      await batch.commit();
    }
    await deleteDoc(questionDoc.ref);
  }

  await deleteDoc(getSessionRef(sessionId));
}

export type CustomSessionQuestionInput = {
  title: string;
  prompt: string;
  inputType: QuestionInputType;
  visibility: ResultVisibility;
  phase?: LessonPhase;
  choices?: string[];
  // choices와 인덱스 정렬된 기존 선택지 id(편집 시 유지). 없으면 저장 시 생성된다.
  choiceIds?: string[];
  maxLength?: number;
};

type CustomSessionInput = {
  sessionId: string;
  title: string;
  questions: CustomSessionQuestionInput[];
  accepting?: boolean;
  owner: {
    uid: string;
    organizationId?: string;
  };
};

const MAX_CUSTOM_QUESTIONS = 30;
const DEFAULT_SCALE_CHOICES = ['1', '2', '3', '4', '5'];
const DEFAULT_STATUS_CHOICES = ['준비 완료', '진행 중', '완료', '도움 필요'];

function normalizeCustomSessionId(rawSessionId: string) {
  const sessionId = rawSessionId.trim().toLowerCase();

  if (!sessionId) {
    throw new Error('sessionId를 입력해주세요.');
  }

  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(sessionId)) {
    throw new Error('sessionId는 영문 소문자, 숫자, -, _ 조합으로 3~64자만 사용할 수 있습니다.');
  }

  return sessionId;
}

/**
 * 선택지 텍스트와 고유 id를 lockstep으로 정리한다. 빈 텍스트는 id와 함께 제거하고,
 * id가 없는 자리는 새로 생성한다. scale/status 기본 선택지에도 id를 부여한다.
 */
function sanitizeChoicesWithIds(
  inputType: QuestionInputType,
  choices: string[] | undefined,
  choiceIds: string[] | undefined,
): { choices: string[]; choiceIds: string[] } {
  const paired: { text: string; id: string }[] = [];
  (choices ?? []).forEach((choice, index) => {
    const text = choice.trim();
    if (!text) return;
    paired.push({ text, id: choiceIds?.[index]?.trim() || makeChoiceId() });
  });
  const cleaned = paired.slice(0, 20);

  const withDefaults = (defaults: readonly string[]) =>
    cleaned.length > 0 ? cleaned : defaults.map((text) => ({ text, id: makeChoiceId() }));

  const split = (list: { text: string; id: string }[]) => ({
    choices: list.map((item) => item.text),
    choiceIds: list.map((item) => item.id),
  });

  if (inputType === 'scale') {
    return split(withDefaults(DEFAULT_SCALE_CHOICES));
  }

  if (inputType === 'status') {
    return split(withDefaults(DEFAULT_STATUS_CHOICES));
  }

  if (inputType === 'choice' || inputType === 'multi') {
    if (cleaned.length < 2) {
      throw new Error('객관식/복수 선택 질문은 선택지를 2개 이상 입력해주세요.');
    }
    return split(cleaned);
  }

  return { choices: [], choiceIds: [] };
}

export function inferInteractionType(phase: LessonPhase, inputType: QuestionInputType): InteractionType {
  if (phase === 'intro') return 'prior-knowledge';
  if (phase === 'practice') return inputType === 'status' ? 'readiness-check' : 'progress-check';
  if (phase === 'ethics') return 'ethics-case';
  if (phase === 'wrapup') return 'exit-ticket';
  return 'concept-check';
}

export function inferPurpose(phase: LessonPhase, inputType: QuestionInputType): InteractionPurpose {
  if (inputType === 'status') return 'ops';
  if (phase === 'ethics' || phase === 'wrapup') return 'reflection';
  return 'learning';
}

function normalizeCustomQuestion(question: CustomSessionQuestionInput, index: number): SeedQuestion {
  const title = question.title.trim();
  const prompt = question.prompt.trim();
  const phase = question.phase ?? 'intro';
  const maxLength = Math.max(50, Math.min(300, question.maxLength ?? 300));

  if (!title) {
    throw new Error(`Q${index + 1} 제목을 입력해주세요.`);
  }

  if (!prompt) {
    throw new Error(`Q${index + 1} 질문 문구를 입력해주세요.`);
  }

  const { choices, choiceIds } = sanitizeChoicesWithIds(
    question.inputType,
    question.choices,
    question.choiceIds,
  );

  return {
    id: `q${String(index + 1).padStart(2, '0')}`,
    order: index + 1,
    type: question.inputType === 'text' ? 'text' : 'choice',
    title,
    prompt,
    choices,
    choiceIds,
    maxLength,
    visible: true,
    phase,
    interactionType: inferInteractionType(phase, question.inputType),
    inputType: question.inputType,
    visibility: question.visibility,
    purpose: inferPurpose(phase, question.inputType),
    presenterNote: '',
    timingLabel: '',
  };
}

export async function createCustomQuestionSession({
  sessionId: rawSessionId,
  title,
  questions,
  accepting = true,
  owner,
}: CustomSessionInput): Promise<void> {
  const database = requireDb();
  const sessionId = normalizeCustomSessionId(rawSessionId);
  const sessionRef = getSessionRef(sessionId);
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error('세션 제목을 입력해주세요.');
  }

  if (questions.length === 0) {
    throw new Error('질문을 하나 이상 입력해주세요.');
  }

  if (questions.length > MAX_CUSTOM_QUESTIONS) {
    throw new Error(`질문은 한 세션에 최대 ${MAX_CUSTOM_QUESTIONS}개까지 만들 수 있습니다.`);
  }

  const existingSession = await getDoc(sessionRef);
  if (existingSession.exists()) {
    throw new Error(`이미 존재하는 세션 ID입니다: ${sessionId}`);
  }

  const normalizedQuestions = questions.map(normalizeCustomQuestion);
  const activeQuestionId = normalizedQuestions[0]?.id ?? null;

  await setDoc(sessionRef, {
    title: normalizedTitle,
    activeQuestionId,
    accepting,
    showResults: false,
    templateId: null,
    currentPhase: normalizedQuestions[0]?.phase ?? null,
    ownerUid: owner.uid,
    organizationId: owner.organizationId?.trim() || null,
    schemaVersion: 2,
    source: 'custom',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const batch = writeBatch(database);
  normalizedQuestions.forEach((question) => {
    batch.set(getQuestionRef(sessionId, question.id), {
      ...question,
      // 새 질문은 닫힌 상태로 생성 — 강사가 Admin에서 질문별로 연다.
      open: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}

/** 질문 단위 오픈 상태를 토글한다(학생 답변 게이트). 세션 accepting과 AND로 걸린다. */
export async function setQuestionOpen(sessionId: string, questionId: string, open: boolean) {
  await updateDoc(getQuestionRef(sessionId, questionId), {
    open,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 한 번에 한 질문만 응답을 여는 단일-오픈 모델.
 * 대상 질문만 open=true로 열고 나머지는 모두 닫는다. 세션은 accepting=true,
 * activeQuestionId=대상, showResults=false(결과는 항상 비공개로 리셋)로 맞춘다.
 */
export async function openQuestionExclusively(
  sessionId: string,
  questionId: string,
  allQuestionIds: string[],
) {
  const batch = writeBatch(requireDb());
  allQuestionIds.forEach((id) => {
    batch.update(getQuestionRef(sessionId, id), {
      open: id === questionId,
      updatedAt: serverTimestamp(),
    });
  });
  batch.update(getSessionRef(sessionId), {
    accepting: true,
    activeQuestionId: questionId,
    showResults: false,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/** 현재 열린 질문을 닫는다. 질문 open=false, 세션 accepting=false, 결과 비공개로 리셋. */
export async function closeQuestion(sessionId: string, questionId: string) {
  const batch = writeBatch(requireDb());
  batch.update(getQuestionRef(sessionId, questionId), {
    open: false,
    updatedAt: serverTimestamp(),
  });
  batch.update(getSessionRef(sessionId), {
    accepting: false,
    showResults: false,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/** 편집 시 질문 draft. questionId가 있으면 기존 질문(응답 보존), 없으면 새 질문. */
export type EditCustomSessionQuestionInput = CustomSessionQuestionInput & {
  questionId?: string;
};

type UpdateCustomSessionInput = {
  sessionId: string;
  title: string;
  questions: EditCustomSessionQuestionInput[];
};

/**
 * 기존 세션의 제목/질문을 수정한다. 핵심 원칙:
 * - questionId가 있는 draft는 **그 doc ID를 그대로 재사용**한다. 질문 doc를 덮어써도
 *   하위 answers 서브컬렉션은 삭제되지 않으므로 기존 응답이 보존된다.
 * - questionId가 없는 draft는 기존 ID와 충돌하지 않는 새 q번호를 할당한다.
 * - 목록에 없는 기존 질문은 **삭제하지 않는다**(응답 유실 방지). 삭제는 이 함수의 책임이 아니다.
 */
export async function updateCustomQuestionSession({
  sessionId,
  title,
  questions,
}: UpdateCustomSessionInput): Promise<void> {
  const database = requireDb();
  const sessionRef = getSessionRef(sessionId);
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error('세션 제목을 입력해주세요.');
  }

  if (questions.length === 0) {
    throw new Error('질문을 하나 이상 입력해주세요.');
  }

  if (questions.length > MAX_CUSTOM_QUESTIONS) {
    throw new Error(`질문은 한 세션에 최대 ${MAX_CUSTOM_QUESTIONS}개까지 만들 수 있습니다.`);
  }

  const existingSession = await getDoc(sessionRef);
  if (!existingSession.exists()) {
    throw new Error(`세션을 찾을 수 없습니다: ${sessionId}`);
  }

  // 기존 질문 ID는 그대로 예약해 두고, 새 질문은 겹치지 않는 q번호를 할당한다.
  const reservedIds = new Set(
    questions
      .map((question) => question.questionId?.trim())
      .filter((id): id is string => Boolean(id)),
  );
  let counter = 0;
  const allocateNewId = () => {
    let candidate: string;
    do {
      counter += 1;
      candidate = `q${String(counter).padStart(2, '0')}`;
    } while (reservedIds.has(candidate));
    reservedIds.add(candidate);
    return candidate;
  };

  const normalizedQuestions = questions.map((question, index) => {
    const normalized = normalizeCustomQuestion(question, index);
    const questionId = question.questionId?.trim() || allocateNewId();
    return { ...normalized, id: questionId };
  });

  // 기존 activeQuestionId가 여전히 유효하면 유지, 아니면 첫 질문으로 되돌린다.
  const previousActiveId = (existingSession.data() as SessionDoc).activeQuestionId;
  const activeQuestionId =
    previousActiveId && normalizedQuestions.some((q) => q.id === previousActiveId)
      ? previousActiveId
      : normalizedQuestions[0]?.id ?? null;

  const batch = writeBatch(database);
  batch.set(
    sessionRef,
    {
      title: normalizedTitle,
      activeQuestionId,
      currentPhase: normalizedQuestions[0]?.phase ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  normalizedQuestions.forEach((question) => {
    batch.set(
      getQuestionRef(sessionId, question.id),
      {
        ...question,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
}
