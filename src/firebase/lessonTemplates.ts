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
  type Unsubscribe,
} from 'firebase/firestore';
import { requireDb } from './client';
import type { LessonTemplateDoc, TemplatePhase } from './types';

function getTemplatesCollection() {
  return collection(requireDb(), 'lessonTemplates');
}

function getTemplateRef(templateId: string) {
  return doc(requireDb(), 'lessonTemplates', templateId);
}

export function subscribeTemplates(
  callback: (templates: LessonTemplateDoc[]) => void,
): Unsubscribe {
  const q = query(getTemplatesCollection(), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as LessonTemplateDoc)));
  });
}

export async function createTemplate(data: {
  title: string;
  subject: string;
  description: string;
  phases: TemplatePhase[];
}): Promise<string> {
  const ref = doc(getTemplatesCollection());
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTemplate(
  templateId: string,
  data: Partial<{
    title: string;
    subject: string;
    description: string;
    phases: TemplatePhase[];
  }>,
): Promise<void> {
  await updateDoc(getTemplateRef(templateId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await deleteDoc(getTemplateRef(templateId));
}

export async function getAllTemplates(): Promise<LessonTemplateDoc[]> {
  const snapshot = await getDocs(query(getTemplatesCollection(), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as LessonTemplateDoc));
}
