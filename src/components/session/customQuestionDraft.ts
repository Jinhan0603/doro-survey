import { nanoid } from 'nanoid';
import type { EditCustomSessionQuestionInput } from '../../firebase/sessions';
import type { LessonPhase, QuestionDoc, QuestionInputType, ResultVisibility } from '../../firebase/types';
import { makeChoiceId } from '../../utils/questionRuntime';

/** 편집기 내 선택지 한 칸. id는 저장 후에도 유지되어 응답 집계의 기준이 된다. */
export type ChoiceDraft = { id: string; text: string };

export type CustomQuestionDraft = {
  clientId: string;
  // 편집 모드에서 기존 질문이면 원본 doc ID(응답 보존용). 새 질문은 undefined.
  questionId?: string;
  phase: LessonPhase;
  title: string;
  prompt: string;
  inputType: QuestionInputType;
  visibility: ResultVisibility;
  choices: ChoiceDraft[];
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
  public: '학생 화면(Display)에 결과를 공개합니다.',
  'teacher-only': '학생 화면에 공개하지 않습니다.',
  hidden: '학생 화면에 공개하지 않습니다.',
};

/** 텍스트 배열을 새 id가 붙은 ChoiceDraft 배열로 만든다. */
export function toChoiceDrafts(texts: string[]): ChoiceDraft[] {
  return texts.map((text) => ({ id: makeChoiceId(), text }));
}

export function getDefaultChoices(inputType: QuestionInputType): ChoiceDraft[] {
  if (inputType === 'scale') {
    return toChoiceDrafts(['1', '2', '3', '4', '5']);
  }

  if (inputType === 'status') {
    return toChoiceDrafts(['준비 완료', '진행 중', '완료', '도움 필요']);
  }

  if (inputType === 'multi') {
    return toChoiceDrafts(['개념 이해', '실습 진행', '질문 있음', '공유하고 싶음']);
  }

  // 객관식(choice)은 예시 없이 빈 2칸으로 시작한다(에디터가 최소 2개를 보장).
  return toChoiceDrafts(['', '']);
}

export function hasChoiceOptions(inputType: QuestionInputType) {
  return inputType === 'choice' || inputType === 'multi' || inputType === 'scale' || inputType === 'status';
}

export function createDraft(input: Partial<CustomQuestionDraft> = {}): CustomQuestionDraft {
  const inputType = input.inputType ?? 'choice';

  return {
    clientId: nanoid(),
    questionId: input.questionId,
    phase: input.phase ?? 'intro',
    title: input.title ?? '',
    prompt: input.prompt ?? '',
    inputType,
    visibility: input.visibility ?? 'public',
    choices: input.choices ?? getDefaultChoices(inputType),
    maxLength: input.maxLength ?? 300,
  };
}

export function createInitialDrafts(): CustomQuestionDraft[] {
  return [];
}

/** 기존 세션 질문(QuestionDoc)을 편집용 draft로 변환한다(응답 보존을 위해 questionId 유지). */
export function createDraftFromQuestion(question: QuestionDoc): CustomQuestionDraft {
  const inputType: QuestionInputType = question.inputType ?? (question.type === 'text' ? 'text' : 'choice');
  const texts = question.choices ?? [];
  const ids = question.choiceIds ?? [];
  // 저장된 choiceIds가 있으면 그대로 재사용(응답 집계 정체성 유지), 없으면 새로 부여.
  const choices: ChoiceDraft[] = texts.map((text, index) => ({
    id: ids[index] ?? makeChoiceId(),
    text,
  }));
  return createDraft({
    questionId: question.id,
    phase: question.phase ?? 'intro',
    title: question.title,
    prompt: question.prompt,
    inputType,
    visibility: question.visibility ?? 'public',
    choices,
    maxLength: question.maxLength ?? 300,
  });
}

/** draft 선택지에서 공백 제거·빈칸 제외한 텍스트만 뽑는다(템플릿 interaction 저장 등). */
export function draftChoiceTexts(choices: ChoiceDraft[]): string[] {
  return choices.map((choice) => choice.text.trim()).filter(Boolean);
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

export function toQuestionInput(draft: CustomQuestionDraft): EditCustomSessionQuestionInput {
  // choices/choiceIds를 인덱스 정렬로 함께 넘긴다(빈칸 정리는 sanitizeChoicesWithIds가 lockstep 처리).
  return {
    questionId: draft.questionId,
    title: draft.title,
    prompt: draft.prompt,
    inputType: draft.inputType,
    // 결과 공개 범위는 더 이상 나누지 않는다 — 항상 공개(public)로 저장한다.
    visibility: 'public',
    phase: draft.phase,
    choices: draft.choices.map((choice) => choice.text),
    choiceIds: draft.choices.map((choice) => choice.id),
    maxLength: draft.maxLength,
  };
}
