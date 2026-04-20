import type { Timestamp } from 'firebase/firestore';

export type QuestionType = 'choice' | 'text';

export type SessionDoc = {
  title: string;
  activeQuestionId: string | null;
  accepting: boolean;
  showResults: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type QuestionDoc = {
  id: string;
  order: number;
  type: QuestionType;
  title: string;
  prompt: string;
  choices: string[];
  maxLength: number;
  visible: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type AnswerDoc = {
  uid: string;
  nickname: string;
  answer: string | null;
  answerText: string | null;
  approved: boolean;
  hidden: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type SeedQuestion = Omit<QuestionDoc, 'createdAt' | 'updatedAt'>;
