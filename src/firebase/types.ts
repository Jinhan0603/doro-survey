import type { Timestamp } from 'firebase/firestore';

// ──────────────────────────────────────────────────────────────
// V1 types (preserved — do not change)
// ──────────────────────────────────────────────────────────────

export type QuestionType = 'choice' | 'text';

export type SessionDoc = {
  title: string;
  activeQuestionId: string | null;
  accepting: boolean;
  showResults: boolean;
  templateId?: string | null;
  currentPhase?: LessonPhase | null;
  schemaVersion?: number;
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
  // V2 optional fields — existing V1 docs without these still work
  phase?: LessonPhase | null;
  interactionType?: InteractionType | null;
  inputType?: QuestionInputType | null;
  visibility?: ResultVisibility | null;
  purpose?: InteractionPurpose | null;
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

// ──────────────────────────────────────────────────────────────
// V2 enum types
// ──────────────────────────────────────────────────────────────

export type LessonPhase = 'intro' | 'theory' | 'practice' | 'ethics' | 'wrapup';

export type InteractionPurpose = 'learning' | 'ops' | 'reflection';

export type ResultVisibility = 'public' | 'teacher-only' | 'hidden';

export type InteractionType =
  | 'prior-knowledge'
  | 'prediction'
  | 'concept-check'
  | 'confidence-check'
  | 'readiness-check'
  | 'progress-check'
  | 'troubleshoot'
  | 'ethics-case'
  | 'exit-ticket';

export type QuestionInputType = 'choice' | 'text' | 'multi' | 'scale' | 'status';

export type UserRole = 'admin' | 'teacher';

// ──────────────────────────────────────────────────────────────
// V2 Firestore document types
// ──────────────────────────────────────────────────────────────

export type LessonTemplateDoc = {
  id: string;
  ownerUid: string;
  title: string;
  subject: string;
  description: string;
  shared: boolean;
  schemaVersion: 2;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type LessonSlideDoc = {
  id: string;
  order: number;
  phase: LessonPhase;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type LessonInteractionDoc = {
  id: string;
  order: number;
  phase: LessonPhase;
  interactionType: InteractionType;
  purpose: InteractionPurpose;
  inputType: QuestionInputType;
  visibility: ResultVisibility;
  title: string;
  prompt: string;
  choices: string[];
  maxLength: number;
  schemaVersion: 2;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type UserProfileDoc = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schemaVersion: 2;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};
