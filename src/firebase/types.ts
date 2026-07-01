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
  // 결과가 공개된 질문 id. showResults와 함께 '어느 질문의 결과가 공개 중인지'를 식별한다.
  // 응답 마감(open=false)된 질문도 결과 공개가 가능하도록, 공개 대상은 open 상태와 분리한다.
  // 없거나 activeQuestionId와 다르면 그 질문은 결과 비공개로 취급한다.
  resultQuestionId?: string | null;
  templateId?: string | null;
  currentPhase?: LessonPhase | null;
  ownerUid?: string | null;
  organizationId?: string | null;
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
  // choices와 인덱스 정렬된 선택지 고유 id. 신규/편집 질문에 부여되며,
  // 응답 집계가 선택지 이름 변경에도 정체성을 따라가게 한다. 레거시 질문엔 없을 수 있음.
  choiceIds?: string[] | null;
  maxLength: number;
  visible: boolean;
  // 학생이 이 질문에 답변할 수 있는지(질문 단위 오픈). 여러 질문을 동시에 열 수 있다.
  // 레거시 문서엔 없을 수 있으며, 없으면 닫힘(false)으로 취급한다.
  open?: boolean;
  // V2 optional fields — existing V1 docs without these still work
  phase?: LessonPhase | null;
  interactionType?: InteractionType | null;
  inputType?: QuestionInputType | null;
  visibility?: ResultVisibility | null;
  purpose?: InteractionPurpose | null;
  presenterNote?: string | null;
  timingLabel?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type AnswerDoc = {
  uid: string;
  nickname: string;
  answer: string | null;
  answerText: string | null;
  answerKind?: QuestionInputType | null;
  answerValue?: string | null;
  answerValues?: string[] | null;
  // 선택형 응답이 가리키는 선택지 고유 id(신규 응답에만 기록). 텍스트 문항은 null.
  answerChoiceId?: string | null;
  answerChoiceIds?: string[] | null;
  displayAnswer?: string | null;
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

export type TemplateVisibility = 'private' | 'org' | 'shared';

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

export type AnswerKind = QuestionInputType;

export type UserRole = 'admin' | 'teacher';

// ──────────────────────────────────────────────────────────────
// V2 Firestore document types
// ──────────────────────────────────────────────────────────────

export type LessonTemplateDoc = {
  id: string;
  ownerUid: string;
  organizationId?: string | null;
  title: string;
  subject: string;
  description: string;
  shared: boolean;
  templateVisibility?: TemplateVisibility | null;
  targetGrade?: string | null;
  toolTags?: string[] | null;
  slideCount?: number | null;
  interactionCount?: number | null;
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
  slideNumber?: number | null;
  detectedPhase?: LessonPhase | null;
  phaseConfidence?: number | null;
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
  presenterNote?: string | null;
  timingLabel?: string | null;
  schemaVersion: 2;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type UserProfileDoc = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId?: string | null;
  schemaVersion: 2;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};
