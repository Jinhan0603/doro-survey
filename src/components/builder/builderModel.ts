import { nanoid } from 'nanoid';
import { type InteractionSeed } from '../../data/lessonTemplatePresets';
import type { LessonPhase, TemplateVisibility } from '../../firebase/types';
import type {
  InteractionGeneratorAudienceLevel,
  InteractionGeneratorDensity,
  InteractionGeneratorSubjectType,
} from '../../utils/interactionGenerator';

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

export type EditableInteraction = InteractionSeed & {
  clientId: string;
  sortOrder: number;
};

export type GeneratorOptionsState = {
  subjectType: InteractionGeneratorSubjectType;
  audienceLevel: InteractionGeneratorAudienceLevel;
  density: InteractionGeneratorDensity;
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

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptionsState = {
  subjectType: 'mixed',
  audienceLevel: 'middle',
  density: 'medium',
};

export function parseToolTags(input: string) {
  return input
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatToolTags(tags?: string[] | null) {
  return tags?.join(', ') ?? '';
}

export function createEditableInteraction(seed: InteractionSeed, sortOrder: number): EditableInteraction {
  return {
    clientId: nanoid(),
    sortOrder,
    ...seed,
    choices: [...seed.choices],
    presenterNote: seed.presenterNote ?? '',
    timingLabel: seed.timingLabel ?? '',
  };
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

// 단계(phase) 그룹핑 없이 전역 순서(sortOrder)대로 평면 정렬한다.
export function sortInteractions(items: EditableInteraction[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder);
}

export function sortSlides(items: EditableSlide[]) {
  return [...items].sort((left, right) => left.slideNumber - right.slideNumber);
}

export function getNextSortOrder(items: EditableInteraction[]) {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
}

// 전역 평면 목록에서 인접한 질문과 순서를 맞바꾼다(phase 무관).
export function swapInteractionOrder(items: EditableInteraction[], clientId: string, direction: -1 | 1) {
  const sorted = [...items].sort((left, right) => left.sortOrder - right.sortOrder);
  const index = sorted.findIndex((item) => item.clientId === clientId);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
    return items;
  }

  const current = sorted[index];
  const adjacent = sorted[nextIndex];

  return items.map((item) => {
    if (item.clientId === current.clientId) {
      return { ...item, sortOrder: adjacent.sortOrder };
    }

    if (item.clientId === adjacent.clientId) {
      return { ...item, sortOrder: current.sortOrder };
    }

    return item;
  });
}
