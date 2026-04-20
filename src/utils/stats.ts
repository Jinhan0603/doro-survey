import type { Timestamp } from 'firebase/firestore';
import type { AnswerDoc, QuestionDoc } from '../firebase/types';

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
  const counts = new Map(question.choices.map((choice) => [choice, 0]));

  answers.forEach((answer) => {
    const value = answer.answer ?? '';
    if (counts.has(value)) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  });

  return question.choices.map((choice) => ({
    name: choice,
    value: counts.get(choice) ?? 0,
  }));
}

export function getApprovedTextAnswers(answers: AnswerDoc[]) {
  return answers
    .filter((answer) => answer.approved && !answer.hidden && answer.answerText)
    .map((answer) => ({
      nickname: answer.nickname,
      answer: answer.answerText ?? '',
    }));
}

export function getAnswerSummary(question: QuestionDoc, answer: AnswerDoc) {
  return question.type === 'choice' ? answer.answer ?? '' : answer.answerText ?? '';
}
