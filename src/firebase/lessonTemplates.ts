import {
  collection,
  deleteDoc,
  doc,
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
  title: string;
  subject: string;
  description: string;
  shared?: boolean;
}): Promise<string> {
  const ref = doc(templatesCol());
  await setDoc(ref, {
    ownerUid: input.ownerUid,
    title: input.title.trim(),
    subject: input.subject.trim(),
    description: (input.description ?? '').trim(),
    shared: input.shared ?? false,
    schemaVersion: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLessonTemplate(
  templateId: string,
  patch: Partial<Pick<LessonTemplateDoc, 'title' | 'subject' | 'description' | 'shared'>>,
): Promise<void> {
  await updateDoc(templateRef(templateId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLessonTemplate(templateId: string): Promise<void> {
  await deleteDoc(templateRef(templateId));
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
  callback: (templates: LessonTemplateDoc[]) => void,
): Unsubscribe {
  const q = query(
    templatesCol(),
    where('shared', '==', true),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id } as LessonTemplateDoc))),
  );
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
}

// ── duplicate template ──────────────────────────────────────

export async function duplicateLessonTemplate(
  templateId: string,
  newOwner: { uid: string },
): Promise<string> {
  const db = requireDb();

  const [templateSnap, slidesSnap, interactionsSnap] = await Promise.all([
    getDocs(query(collection(db, 'lessonTemplates'), where('__name__', '==', templateId))),
    getDocs(query(slidesCol(templateId), orderBy('order', 'asc'))),
    getDocs(query(interactionsCol(templateId), orderBy('order', 'asc'))),
  ]);

  if (templateSnap.empty) throw new Error(`Template ${templateId} not found`);

  const sourceData = templateSnap.docs[0].data() as LessonTemplateDoc;
  const newTemplateRef = doc(templatesCol());

  await setDoc(newTemplateRef, {
    ownerUid: newOwner.uid,
    title: `${sourceData.title} (복사본)`,
    subject: sourceData.subject,
    description: sourceData.description,
    shared: false,
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
): Promise<void> {
  const db = requireDb();

  const interactionsSnap = await getDocs(
    query(interactionsCol(templateId), orderBy('order', 'asc')),
  );

  if (interactionsSnap.empty) return;

  const sessionRef = doc(db, 'sessions', sessionId);
  await setDoc(sessionRef, {
    title: title.trim(),
    activeQuestionId: null,
    accepting: false,
    showResults: false,
    templateId,
    currentPhase: null,
    schemaVersion: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const interactions = interactionsSnap.docs.map((d) => ({
    ...(d.data() as LessonInteractionDoc),
    id: d.id,
  }));

  for (let i = 0; i < interactions.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    interactions.slice(i, i + BATCH_LIMIT).forEach((interaction) => {
      const questionRef = doc(questionsCol(sessionId));
      // Map LessonInteractionDoc fields to QuestionDoc — V1-compatible
      const questionData = {
        order: interaction.order,
        // Map QuestionInputType to V1 QuestionType (choice/text fallback)
        type: (interaction.inputType === 'choice' || interaction.inputType === 'multi'
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(questionRef, questionData);
    });
    await batch.commit();
  }
}
