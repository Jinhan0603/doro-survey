import type { AnswerDoc, QuestionDoc, QuestionInputType, ResultVisibility } from '../firebase/types';

export const STATUS_OPTIONS = ['ready', 'doing', 'done', 'need_help'] as const;
export const SCALE_OPTIONS = ['1', '2', '3', '4', '5'] as const;

export function getQuestionInputType(
  question: Pick<QuestionDoc, 'type' | 'inputType'>,
): QuestionInputType {
  return question.inputType ?? question.type;
}

export function getQuestionResultVisibility(
  question: Pick<QuestionDoc, 'visibility'>,
): ResultVisibility {
  return question.visibility ?? 'public';
}

export function getQuestionChoices(
  question: Pick<QuestionDoc, 'choices' | 'type' | 'inputType'>,
): string[] {
  const inputType = getQuestionInputType(question);

  if (inputType === 'status') {
    return question.choices.length > 0 ? question.choices : [...STATUS_OPTIONS];
  }

  if (inputType === 'scale') {
    return question.choices.length > 0 ? question.choices : [...SCALE_OPTIONS];
  }

  return question.choices ?? [];
}

export function isModeratedQuestion(
  question: Pick<QuestionDoc, 'type' | 'inputType'>,
) {
  return getQuestionInputType(question) === 'text';
}

export function getAnswerValue(answer: AnswerDoc) {
  return answer.answerValue ?? answer.answer ?? answer.answerText ?? '';
}

export function getAnswerValues(answer: AnswerDoc): string[] {
  if (answer.answerValues && answer.answerValues.length > 0) {
    return answer.answerValues;
  }

  const singleValue = getAnswerValue(answer);
  return singleValue ? [singleValue] : [];
}

export function getDisplayAnswer(answer: AnswerDoc) {
  if (answer.displayAnswer) {
    return answer.displayAnswer;
  }

  if (answer.answerValues && answer.answerValues.length > 0) {
    return answer.answerValues.join(' | ');
  }

  return answer.answerText ?? answer.answer ?? answer.answerValue ?? '';
}

export function isDisplayableQuestion(
  question: Pick<QuestionDoc, 'visibility'>,
) {
  return getQuestionResultVisibility(question) === 'public';
}

export function getQuestionTypeLabel(
  question: Pick<QuestionDoc, 'type' | 'inputType'>,
) {
  const inputType = getQuestionInputType(question);

  if (inputType === 'choice') return '객관식';
  if (inputType === 'text') return '주관식';
  if (inputType === 'multi') return '복수 선택';
  if (inputType === 'scale') return '척도';
  return '상태';
}
