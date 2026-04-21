import type { Timestamp } from 'firebase/firestore';

export type QuestionType = 'choice' | 'text';
export type InteractionType = 'survey' | 'quiz' | 'discussion' | 'reflection';
export type InteractionVisibility = 'public' | 'teacher-only';
export type PhaseType = '도입' | '이론' | '실습' | '윤리' | '마무리';

export type SessionDoc = {
  title: string;
  activeQuestionId: string | null;
  accepting: boolean;
  showResults: boolean;
  templateId?: string | null;
  currentPhase?: PhaseType | null;
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
  phase?: PhaseType | null;
  interactionType?: InteractionType | null;
  visibility?: InteractionVisibility | null;
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

// V2: Lesson Templates

export type TemplateQuestion = {
  order: number;
  type: QuestionType;
  interactionType: InteractionType;
  visibility: InteractionVisibility;
  title: string;
  prompt: string;
  choices: string[];
  maxLength: number;
};

export type TemplatePhase = {
  id: string;
  type: PhaseType;
  label: string;
  questions: TemplateQuestion[];
};

export type LessonTemplateDoc = {
  id: string;
  title: string;
  subject: string;
  description: string;
  phases: TemplatePhase[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};
