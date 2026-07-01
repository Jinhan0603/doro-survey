import { nanoid } from 'nanoid';
import type { LessonPhase, TemplateVisibility } from '../../firebase/types';

export type TemplateFormState = {
  title: string;
  description: string;
  subject: string;
  targetGrade: string;
  toolInput: string;
  templateVisibility: TemplateVisibility;
};

export type EditableSlide = {
  clientId: string;
  slideNumber: number;
  title: string;
  content: string;
  rawTexts: string[];
  phase: LessonPhase;
  detectedPhase: LessonPhase;
  phaseConfidence: number;
};

export const EMPTY_TEMPLATE: TemplateFormState = {
  title: '',
  description: '',
  subject: '',
  targetGrade: '',
  toolInput: '',
  templateVisibility: 'private',
};

// 조직 공유(org)는 제거. 강사는 개인용 고정, 매니저·관리자만 전체 공유를 선택할 수 있다.
export const SHAREABLE_VISIBILITY_LABELS: [TemplateVisibility, string][] = [
  ['private', '개인용'],
  ['shared', '전체 공유'],
];

export function parseToolTags(input: string) {
  return input
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatToolTags(tags?: string[] | null) {
  return tags?.join(', ') ?? '';
}

export function createEditableSlide(input: {
  slideNumber: number;
  title: string;
  content: string;
  rawTexts: string[];
  phase: LessonPhase;
  detectedPhase: LessonPhase;
  phaseConfidence: number;
}): EditableSlide {
  return {
    clientId: nanoid(),
    ...input,
  };
}

export function sortSlides(items: EditableSlide[]) {
  return [...items].sort((left, right) => left.slideNumber - right.slideNumber);
}
