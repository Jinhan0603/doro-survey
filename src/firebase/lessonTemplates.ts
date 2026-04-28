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
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type {
  LessonInteractionDoc,
  LessonSlideDoc,
  LessonTemplateDoc,
  TemplateVisibility,
} from './types';

// ── collection helpers ──────────────────────────────────────

function templatesCol() {
  return collection(requireDb(), 'lessonTemplates');
}

function templateRef(templateId: string) {
  return doc(requireDb(), 'lessonTemplates', templateId);
}

function slidesCol(templateId: string) {
  return collection(requireDb(), 'lessonTemplates', templateId, 'slides');
}

function interactionsCol(templateId: string) {
  return collection(requireDb(), 'lessonTemplates', templateId, 'interactions');
}

function questionsCol(sessionId: string) {
  return collection(requireDb(), 'sessions', sessionId, 'questions');
}

// ── template CRUD ───────────────────────────────────────────

export async function createLessonTemplate(input: {
  ownerUid: string;
  organizationId?: string;
  title: string;
  subject: string;
  description: string;
  templateVisibility?: TemplateVisibility;
  targetGrade?: string;
  toolTags?: string[];
  slideCount?: number;
  interactionCount?: number;
}): Promise<string> {
  const templateVisibility = input.templateVisibility ?? 'private';
  const ref = doc(templatesCol());
  await setDoc(ref, {
    ownerUid: input.ownerUid,
    organizationId: input.organizationId?.trim() || null,
    title: input.title.trim(),
    subject: input.subject.trim(),
    description: (input.description ?? '').trim(),
    shared: templateVisibility !== 'private',
    templateVisibility,
    targetGrade: input.targetGrade?.trim() || null,
    toolTags: input.toolTags?.map((tool) => tool.trim()).filter(Boolean) ?? [],
    slideCount: input.slideCount ?? 0,
    interactionCount: input.interactionCount ?? 0,
    schemaVersion: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLessonTemplate(
  templateId: string,
  patch: Partial<
    Pick<
      LessonTemplateDoc,
      | 'title'
      | 'subject'
      | 'description'
      | 'shared'
      | 'templateVisibility'
      | 'targetGrade'
      | 'toolTags'
      | 'slideCount'
      | 'interactionCount'
      | 'organizationId'
    >
  >,
): Promise<void> {
  const nextPatch = { ...patch };

  if (typeof nextPatch.title === 'string') nextPatch.title = nextPatch.title.trim();
  if (typeof nextPatch.subject === 'string') nextPatch.subject = nextPatch.subject.trim();
  if (typeof nextPatch.description === 'string') nextPatch.description = nextPatch.description.trim();
  if (typeof nextPatch.targetGrade === 'string') nextPatch.targetGrade = nextPatch.targetGrade.trim() || null;
  if (typeof nextPatch.organizationId === 'string') nextPatch.organizationId = nextPatch.organizationId.trim() || null;
  if (nextPatch.toolTags) {
    nextPatch.toolTags = nextPatch.toolTags.map((tool) => tool.trim()).filter(Boolean);
  }
  if (typeof nextPatch.shared === 'boolean' && !nextPatch.templateVisibility) {
    nextPatch.templateVisibility = nextPatch.shared ? 'org' : 'private';
  }
  if (nextPatch.templateVisibility) {
    nextPatch.shared = nextPatch.templateVisibility !== 'private';
  }

  await updateDoc(templateRef(templateId), {
    ...nextPatch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLessonTemplate(templateId: string): Promise<void> {
  const db = requireDb();
  const [slidesSnap, interactionsSnap] = await Promise.all([
    getDocs(slidesCol(templateId)),
    getDocs(interactionsCol(templateId)),
  ]);

  if (!slidesSnap.empty) {
    for (let i = 0; i < slidesSnap.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      slidesSnap.docs.slice(i, i + BATCH_LIMIT).forEach((slideDoc) => batch.delete(slideDoc.ref));
      await batch.commit();
    }
  }

  if (!interactionsSnap.empty) {
    for (let i = 0; i < interactionsSnap.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      interactionsSnap.docs
        .slice(i, i + BATCH_LIMIT)
        .forEach((interactionDoc) => batch.delete(interactionDoc.ref));
      await batch.commit();
    }
  }

  await deleteDoc(templateRef(templateId));
}

export async function getLessonTemplate(templateId: string): Promise<LessonTemplateDoc | null> {
  const snapshot = await getDoc(templateRef(templateId));
  return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as LessonTemplateDoc) : null;
}

export async function getLessonSlides(templateId: string): Promise<LessonSlideDoc[]> {
  const snapshot = await getDocs(query(slidesCol(templateId), orderBy('order', 'asc')));
  return snapshot.docs.map((slideDoc) => ({ ...slideDoc.data(), id: slideDoc.id } as LessonSlideDoc));
}

export async function getLessonInteractions(templateId: string): Promise<LessonInteractionDoc[]> {
  const snapshot = await getDocs(query(interactionsCol(templateId), orderBy('order', 'asc')));
  return snapshot.docs.map(
    (interactionDoc) => ({ ...interactionDoc.data(), id: interactionDoc.id } as LessonInteractionDoc),
  );
}

// ── subscriptions ───────────────────────────────────────────

export function subscribeMyLessonTemplates(
  ownerUid: string,
  callback: (templates: LessonTemplateDoc[]) => void,
): Unsubscribe {
  const q = query(
    templatesCol(),
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as LessonTemplateDoc))),
  );
}

export function subscribeSharedLessonTemplates(
  organizationId: string,
  callback: (templates: LessonTemplateDoc[]) => void,
): Unsubscribe[] {
  const orgVisibilityQuery = query(
    templatesCol(),
    where('templateVisibility', '==', 'org'),
    where('organizationId', '==', organizationId),
    orderBy('createdAt', 'desc'),
  );
  const sharedVisibilityQuery = query(
    templatesCol(),
    where('templateVisibility', '==', 'shared'),
    orderBy('createdAt', 'desc'),
  );
  const legacySharedQuery = query(
    templatesCol(),
    where('shared', '==', true),
    orderBy('createdAt', 'desc'),
  );

  const queryState: Record<'org' | 'shared' | 'legacy', LessonTemplateDoc[]> = {
    org: [],
    shared: [],
    legacy: [],
  };

  const emitMerged = () => {
    const merged = [...queryState.org, ...queryState.shared, ...queryState.legacy];
    const deduped = merged.filter((template, index) => merged.findIndex((item) => item.id === template.id) === index);
    callback(
      deduped.sort((left, right) => {
        const leftMillis = left.createdAt?.toMillis?.() ?? 0;
        const rightMillis = right.createdAt?.toMillis?.() ?? 0;
        return rightMillis - leftMillis;
      }),
    );
  };

  return [
    onSnapshot(orgVisibilityQuery, (snap) => {
      queryState.org = snap.docs.map((d) => ({ ...d.data(), id: d.id } as LessonTemplateDoc));
      emitMerged();
    }),
    onSnapshot(sharedVisibilityQuery, (snap) => {
      queryState.shared = snap.docs.map((d) => ({ ...d.data(), id: d.id } as LessonTemplateDoc));
      emitMerged();
    }),
    onSnapshot(legacySharedQuery, (snap) => {
      queryState.legacy = snap.docs.map((d) => ({ ...d.data(), id: d.id } as LessonTemplateDoc));
      emitMerged();
    }),
  ];
}

export function subscribeLessonSlides(
  templateId: string,
  callback: (slides: LessonSlideDoc[]) => void,
): Unsubscribe {
  const q = query(slidesCol(templateId), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as LessonSlideDoc))),
  );
}

export function subscribeLessonInteractions(
  templateId: string,
  callback: (interactions: LessonInteractionDoc[]) => void,
): Unsubscribe {
  const q = query(interactionsCol(templateId), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as LessonInteractionDoc))),
  );
}

// ── bulk saves (replaces entire subcollection) ──────────────

const BATCH_LIMIT = 400;

export async function saveLessonSlides(
  templateId: string,
  slides: Omit<LessonSlideDoc, 'id' | 'createdAt' | 'updatedAt'>[],
): Promise<void> {
  const db = requireDb();
  const col = slidesCol(templateId);

  // delete existing slides
  const existing = await getDocs(col);
  if (!existing.empty) {
    for (let i = 0; i < existing.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      existing.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // write new slides
  for (let i = 0; i < slides.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    slides.slice(i, i + BATCH_LIMIT).forEach((slide) => {
      const ref = doc(col);
      batch.set(ref, { ...slide, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }

  await updateDoc(templateRef(templateId), {
    slideCount: slides.length,
    updatedAt: serverTimestamp(),
  });
}

export async function saveLessonInteractions(
  templateId: string,
  interactions: Omit<LessonInteractionDoc, 'id' | 'createdAt' | 'updatedAt'>[],
): Promise<void> {
  const db = requireDb();
  const col = interactionsCol(templateId);

  const existing = await getDocs(col);
  if (!existing.empty) {
    for (let i = 0; i < existing.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      existing.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  for (let i = 0; i < interactions.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    interactions.slice(i, i + BATCH_LIMIT).forEach((interaction) => {
      const ref = doc(col);
      batch.set(ref, {
        ...interaction,
        schemaVersion: 2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  await updateDoc(templateRef(templateId), {
    interactionCount: interactions.length,
    updatedAt: serverTimestamp(),
  });
}

// ── duplicate template ──────────────────────────────────────

export async function duplicateLessonTemplate(
  templateId: string,
  newOwner: {
    uid: string;
    organizationId?: string;
  },
): Promise<string> {
  const db = requireDb();

  const [templateSnap, slidesSnap, interactionsSnap] = await Promise.all([
    getDoc(templateRef(templateId)),
    getDocs(query(slidesCol(templateId), orderBy('order', 'asc'))),
    getDocs(query(interactionsCol(templateId), orderBy('order', 'asc'))),
  ]);

  if (!templateSnap.exists()) throw new Error(`Template ${templateId} not found`);

  const sourceData = templateSnap.data() as LessonTemplateDoc;
  const newTemplateRef = doc(templatesCol());

  await setDoc(newTemplateRef, {
    ownerUid: newOwner.uid,
    organizationId: newOwner.organizationId?.trim() || (sourceData.organizationId ?? null),
    title: `${sourceData.title} (복사본)`,
    subject: sourceData.subject,
    description: sourceData.description,
    shared: false,
    templateVisibility: 'private',
    targetGrade: sourceData.targetGrade ?? null,
    toolTags: sourceData.toolTags ?? [],
    slideCount: slidesSnap.size,
    interactionCount: interactionsSnap.size,
    schemaVersion: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const newId = newTemplateRef.id;

  if (!slidesSnap.empty) {
    const batch = writeBatch(db);
    slidesSnap.docs.forEach((d) => {
      const ref = doc(slidesCol(newId));
      batch.set(ref, { ...d.data(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }

  if (!interactionsSnap.empty) {
    const batch = writeBatch(db);
    interactionsSnap.docs.forEach((d) => {
      const ref = doc(interactionsCol(newId));
      batch.set(ref, {
        ...d.data(),
        schemaVersion: 2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }

  return newId;
}

// ── create session from template ────────────────────────────

export async function createSessionFromLessonTemplate(
  templateId: string,
  sessionId: string,
  title: string,
  owner: {
    uid: string;
    organizationId?: string;
  },
): Promise<void> {
  const db = requireDb();
  const normalizedSessionId = sessionId.trim();
  const sessionRef = doc(db, 'sessions', normalizedSessionId);

  if (!normalizedSessionId) {
    throw new Error('세션 ID를 입력해주세요.');
  }

  const existingSession = await getDoc(sessionRef);
  if (existingSession.exists()) {
    throw new Error(`이미 존재하는 세션 ID입니다: ${normalizedSessionId}`);
  }

  const interactionsSnap = await getDocs(
    query(interactionsCol(templateId), orderBy('order', 'asc')),
  );

  if (interactionsSnap.empty) {
    throw new Error('세션을 만들 수 있는 인터랙션이 없습니다. 템플릿을 먼저 저장해주세요.');
  }

  const interactions = interactionsSnap.docs.map((d) => ({
    ...(d.data() as LessonInteractionDoc),
    id: d.id,
  }));

  const questionRefs = interactions.map(() => doc(questionsCol(normalizedSessionId)));

  await setDoc(sessionRef, {
    title: title.trim(),
    activeQuestionId: questionRefs[0]?.id ?? null,
    accepting: false,
    showResults: false,
    templateId,
    currentPhase: interactions[0]?.phase ?? null,
    ownerUid: owner.uid,
    organizationId: owner.organizationId?.trim() || null,
    schemaVersion: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (let i = 0; i < interactions.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    interactions.slice(i, i + BATCH_LIMIT).forEach((interaction, offset) => {
      const questionRef = questionRefs[i + offset];
      // Map LessonInteractionDoc fields to QuestionDoc — V1-compatible
      const questionData = {
        order: interaction.order,
        // Map QuestionInputType to V1 QuestionType (choice/text fallback)
        type: (interaction.inputType === 'choice' ||
          interaction.inputType === 'multi' ||
          interaction.inputType === 'scale' ||
          interaction.inputType === 'status'
          ? 'choice'
          : 'text') as 'choice' | 'text',
        title: interaction.title,
        prompt: interaction.prompt,
        choices: interaction.choices ?? [],
        maxLength: interaction.maxLength ?? 300,
        visible: true,
        // V2 optional fields
        phase: interaction.phase,
        interactionType: interaction.interactionType,
        inputType: interaction.inputType,
        visibility: interaction.visibility,
        purpose: interaction.purpose,
        presenterNote: interaction.presenterNote ?? '',
        timingLabel: interaction.timingLabel ?? '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(questionRef, questionData);
    });
    await batch.commit();
  }
}
