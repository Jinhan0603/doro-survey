import { nanoid } from 'nanoid';
import type { CustomSessionQuestionInput } from '../../firebase/sessions';
import type { LessonPhase, QuestionInputType, ResultVisibility } from '../../firebase/types';

export type CustomQuestionDraft = {
  clientId: string;
  phase: LessonPhase;
  title: string;
  prompt: string;
  inputType: QuestionInputType;
  visibility: ResultVisibility;
  choicesText: string;
  maxLength: number;
};

export const INPUT_TYPE_HELP: Record<QuestionInputType, string> = {
  choice: '하나만 고르는 투표형 질문입니다.',
  text: '학생 생각을 짧은 문장으로 받습니다.',
  multi: '여러 항목을 동시에 고를 수 있습니다.',
  scale: '1~5처럼 정도를 빠르게 확인합니다.',
  status: '준비, 진행, 도움 필요 같은 운영 상태를 봅니다.',
};

export const VISIBILITY_HELP: Record<ResultVisibility, string> = {
  public: 'Display에 공개할 수 있습니다.',
  'teacher-only': 'Admin에서만 집계합니다.',
  hidden: '결과 화면에 표시하지 않습니다.',
};

export function getDefaultChoices(inputType: QuestionInputType) {
  if (inputType === 'scale') {
    return ['1', '2', '3', '4', '5'].join('\n');
  }

  if (inputType === 'status') {
    return ['준비 완료', '진행 중', '완료', '도움 필요'].join('\n');
  }

  if (inputType === 'multi') {
    return ['개념 이해', '실습 진행', '질문 있음', '공유하고 싶음'].join('\n');
  }

  // 객관식(choice)은 예시 없이 빈 2칸으로 시작한다(에디터가 최소 2개를 보장).
  return '';
}

export function hasChoiceOptions(inputType: QuestionInputType) {
  return inputType === 'choice' || inputType === 'multi' || inputType === 'scale' || inputType === 'status';
}

export function createDraft(input: Partial<CustomQuestionDraft> = {}): CustomQuestionDraft {
  const inputType = input.inputType ?? 'choice';

  return {
    clientId: nanoid(),
    phase: input.phase ?? 'intro',
    title: input.title ?? '',
    prompt: input.prompt ?? '',
    inputType,
    visibility: input.visibility ?? 'public',
    choicesText: input.choicesText ?? getDefaultChoices(inputType),
    maxLength: input.maxLength ?? 300,
  };
}

export function createInitialDrafts(): CustomQuestionDraft[] {
  return [];
}

export function parseChoices(choicesText: string) {
  return choicesText
    .split(/[\n,]/)
    .map((choice) => choice.trim())
    .filter(Boolean);
}

export function swapDrafts(drafts: CustomQuestionDraft[], clientId: string, direction: -1 | 1) {
  const currentIndex = drafts.findIndex((draft) => draft.clientId === clientId);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= drafts.length) {
    return drafts;
  }

  const nextDrafts = [...drafts];
  [nextDrafts[currentIndex], nextDrafts[nextIndex]] = [nextDrafts[nextIndex], nextDrafts[currentIndex]];
  return nextDrafts;
}

export function toQuestionInput(draft: CustomQuestionDraft): CustomSessionQuestionInput {
  return {
    title: draft.title,
    prompt: draft.prompt,
    inputType: draft.inputType,
    visibility: draft.visibility,
    phase: draft.phase,
    choices: parseChoices(draft.choicesText),
    maxLength: draft.maxLength,
  };
}
