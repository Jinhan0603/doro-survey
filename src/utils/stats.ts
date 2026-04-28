import type { Timestamp } from 'firebase/firestore';
import type { AnswerDoc, QuestionDoc } from '../firebase/types';
import { getAnswerValue, getAnswerValues, getDisplayAnswer, getQuestionChoices, getQuestionInputType } from './questionRuntime';

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

export function buildChoiceResults(question: QuestionDoc, answers: AnswerDoc[]) {
  const inputType = getQuestionInputType(question);
  const choices = getQuestionChoices(question);
  const counts = new Map(choices.map((choice) => [choice, 0]));

  answers.forEach((answer) => {
    const values = inputType === 'multi' ? getAnswerValues(answer) : [getAnswerValue(answer)];

    values.forEach((value) => {
      if (counts.has(value)) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    });
  });

  return choices.map((choice) => ({
    name: choice,
    value: counts.get(choice) ?? 0,
  }));
}

export function buildStatusResults(question: QuestionDoc, answers: AnswerDoc[]) {
  const counts = new Map(getQuestionChoices(question).map((choice) => [choice, 0]));

  answers.forEach((answer) => {
    const value = getAnswerValue(answer);
    if (counts.has(value)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  });

  return getQuestionChoices(question).map((choice) => ({
    name: choice,
    value: counts.get(choice) ?? 0,
  }));
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
  const displayAnswer = getDisplayAnswer(answer);
  if (displayAnswer) {
    return displayAnswer;
  }

  const inputType = getQuestionInputType(question);
  return inputType === 'text' ? answer.answerText ?? '' : answer.answer ?? '';
}
