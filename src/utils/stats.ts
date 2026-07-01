import type { Timestamp } from 'firebase/firestore';
import type { AnswerDoc, QuestionDoc } from '../firebase/types';
import {
  getAnswerChoiceId,
  getAnswerChoiceIds,
  getAnswerDisplayText,
  getAnswerValue,
  getAnswerValues,
  getDisplayAnswer,
  getQuestionChoiceIds,
  getQuestionChoices,
  getQuestionInputType,
  resolveChoiceIdByText,
} from './questionRuntime';

function toDate(value: Timestamp | Date | null | undefined) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && 'toDate' in value) {
    return value.toDate();
  }

  return null;
}

export function formatTimestamp(value: Timestamp | Date | null | undefined) {
  const date = toDate(value);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * 선택지별 집계. 질문에 choiceIds가 있으면 **선택지 id 기준**으로 세고(응답의
 * answerChoiceId(s) 우선, 없으면 텍스트→id 폴백) 라벨은 현재 선택지 텍스트를 쓴다.
 * id가 없는 레거시 질문은 기존처럼 텍스트 매칭으로 센다.
 */
function tallyChoiceResults(question: QuestionDoc, answers: AnswerDoc[], multi: boolean) {
  const choices = getQuestionChoices(question);
  const choiceIds = getQuestionChoiceIds(question);
  const hasIds = choiceIds.length === choices.length && choices.length > 0;

  if (hasIds) {
    const counts = new Map(choiceIds.map((id) => [id, 0]));
    answers.forEach((answer) => {
      const directIds = multi
        ? getAnswerChoiceIds(answer)
        : [getAnswerChoiceId(answer)].filter((id): id is string => Boolean(id));
      const resolvedIds =
        directIds.length > 0
          ? directIds
          : (multi ? getAnswerValues(answer) : [getAnswerValue(answer)])
              .map((text) => resolveChoiceIdByText(question, text))
              .filter((id): id is string => Boolean(id));
      resolvedIds.forEach((id) => {
        if (counts.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
      });
    });
    return choices.map((choice, index) => ({
      name: choice,
      value: counts.get(choiceIds[index]) ?? 0,
    }));
  }

  const counts = new Map(choices.map((choice) => [choice, 0]));
  answers.forEach((answer) => {
    const values = multi ? getAnswerValues(answer) : [getAnswerValue(answer)];
    values.forEach((value) => {
      if (counts.has(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
    });
  });
  return choices.map((choice) => ({ name: choice, value: counts.get(choice) ?? 0 }));
}

export function buildChoiceResults(question: QuestionDoc, answers: AnswerDoc[]) {
  return tallyChoiceResults(question, answers, getQuestionInputType(question) === 'multi');
}

export function buildStatusResults(question: QuestionDoc, answers: AnswerDoc[]) {
  return tallyChoiceResults(question, answers, false);
}

export function getApprovedTextAnswers(answers: AnswerDoc[]) {
  return answers
    .filter((answer) => answer.approved && !answer.hidden && getDisplayAnswer(answer))
    .map((answer) => ({
      nickname: answer.nickname,
      answer: getDisplayAnswer(answer),
    }));
}

export function getAnswerSummary(question: QuestionDoc, answer: AnswerDoc) {
  // 선택형은 선택지 id로 현재 텍스트를 해석(이름 변경 반영), 없으면 저장된 표시 텍스트 폴백.
  const displayText = getAnswerDisplayText(question, answer);
  if (displayText) {
    return displayText;
  }

  const inputType = getQuestionInputType(question);
  return inputType === 'text' ? answer.answerText ?? '' : answer.answer ?? '';
}
