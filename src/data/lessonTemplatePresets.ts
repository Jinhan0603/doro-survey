import type {
  InteractionPurpose,
  InteractionType,
  LessonInteractionDoc,
  LessonPhase,
  QuestionInputType,
  ResultVisibility,
} from '../firebase/types';

export const PHASE_ORDER: LessonPhase[] = ['intro', 'theory', 'practice', 'ethics', 'wrapup'];

export const PHASE_LABELS: Record<LessonPhase, string> = {
  intro: '도입',
  theory: '이론',
  practice: '실습',
  ethics: '윤리/활용 사례',
  wrapup: '마무리',
};

export const PHASE_SHORT_LABELS: Record<LessonPhase, string> = {
  intro: '도입',
  theory: '이론',
  practice: '실습',
  ethics: '윤리',
  wrapup: '마무리',
};

export const PHASE_DESCRIPTIONS: Record<LessonPhase, string> = {
  intro: '수업 목표를 열고 학생의 경험과 궁금증을 끌어올립니다.',
  theory: '원리, 개념, 구조를 짧고 명확하게 정리합니다.',
  practice: '따라하기와 미션 수행, 중간 점검을 운영합니다.',
  ethics: '활용 사례와 책임, 안전, 저작권을 함께 점검합니다.',
  wrapup: '회고와 퀴즈, 다음 시간 연결 질문으로 마무리합니다.',
};

export const PHASE_COLORS: Record<LessonPhase, string> = {
  intro: 'var(--color-phase-intro)',
  theory: 'var(--color-phase-theory)',
  practice: 'var(--color-phase-practice)',
  ethics: 'var(--color-phase-ethics)',
  wrapup: 'var(--color-phase-closing)',
};

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  'prior-knowledge': '도입 질문',
  prediction: '예측 질문',
  'concept-check': '이론 체크',
  'confidence-check': '이해도 체크',
  'readiness-check': '실습 준비 체크',
  'progress-check': '실습 중간 체크',
  troubleshoot: '문제 해결 체크',
  'ethics-case': '윤리 질문',
  'exit-ticket': '마무리 질문',
};

export const INPUT_TYPE_LABELS: Record<QuestionInputType, string> = {
  choice: '객관식',
  text: '주관식',
  multi: '복수 선택',
  scale: '척도',
  status: '상태 체크',
};

export const PURPOSE_LABELS: Record<InteractionPurpose, string> = {
  learning: '학습',
  ops: '운영',
  reflection: '회고',
};

export const VISIBILITY_LABELS: Record<ResultVisibility, string> = {
  public: '학생 공개',
  'teacher-only': '강사용',
  hidden: '비공개',
};

export type InteractionSeed = Omit<
  LessonInteractionDoc,
  'id' | 'order' | 'createdAt' | 'updatedAt' | 'schemaVersion'
>;

export function createEmptyInteractionSeed(phase: LessonPhase): InteractionSeed {
  return {
    phase,
    interactionType: phase === 'practice' ? 'progress-check' : 'concept-check',
    purpose: phase === 'wrapup' ? 'reflection' : 'learning',
    inputType: phase === 'practice' ? 'choice' : 'text',
    visibility: 'public',
    title: '',
    prompt: '',
    choices: [],
    maxLength: 300,
    presenterNote: '',
    timingLabel: '',
  };
}

type PresetDefinition = {
  id: string;
  label: string;
  description: string;
  seed: InteractionSeed;
};

export const DORO_INTERACTION_PRESETS: PresetDefinition[] = [
  {
    id: 'intro-question',
    label: '도입 질문 추가',
    description: '학생의 경험과 기대를 빠르게 열어주는 오프닝 질문입니다.',
    seed: {
      phase: 'intro',
      interactionType: 'prior-knowledge',
      purpose: 'learning',
      inputType: 'text',
      visibility: 'public',
      title: '오늘 수업에서 가장 궁금한 점',
      prompt: '오늘 기술 수업에서 가장 궁금한 점이나 기대하는 것을 한 가지 적어보세요.',
      choices: [],
      maxLength: 300,
      presenterNote: '학생들의 언어를 받아 오늘 수업 목표와 연결해 주세요.',
      timingLabel: '3분',
    },
  },
  {
    id: 'theory-check',
    label: '이론 체크 추가',
    description: '핵심 개념 설명 뒤 이해도를 짧게 확인합니다.',
    seed: {
      phase: 'theory',
      interactionType: 'concept-check',
      purpose: 'learning',
      inputType: 'choice',
      visibility: 'public',
      title: '핵심 개념 이해 체크',
      prompt: '방금 설명한 개념 중 가장 핵심이라고 생각한 요소를 골라보세요.',
      choices: ['개념 정의', '구조/원리', '사용 순서', '주의사항'],
      maxLength: 300,
      presenterNote: '응답 분포를 보고 개념 설명을 한 번 더 정리할지 결정합니다.',
      timingLabel: '2분',
    },
  },
  {
    id: 'practice-readiness',
    label: '실습 준비 체크 추가',
    description: '실습 시작 전 도구와 세팅 상태를 확인합니다.',
    seed: {
      phase: 'practice',
      interactionType: 'readiness-check',
      purpose: 'ops',
      inputType: 'status',
      visibility: 'teacher-only',
      title: '실습 준비 상태',
      prompt: '실습 도구와 계정, 장비 준비가 모두 되었나요?',
      choices: ['준비 완료', '도움 필요', '기기 문제 있음'],
      maxLength: 300,
      presenterNote: '도움 필요 응답 비율이 높으면 시작 전에 세팅을 다시 안내합니다.',
      timingLabel: '1분',
    },
  },
  {
    id: 'practice-progress',
    label: '실습 중간 체크 추가',
    description: '실습 도중 진행 상황과 막힌 지점을 확인합니다.',
    seed: {
      phase: 'practice',
      interactionType: 'progress-check',
      purpose: 'learning',
      inputType: 'choice',
      visibility: 'teacher-only',
      title: '실습 진행 체크',
      prompt: '현재 실습 진행 상태와 가장 가까운 항목을 골라보세요.',
      choices: ['완료 직전', '절반 이상 진행', '시작했지만 막힘', '아직 시작 전'],
      maxLength: 300,
      presenterNote: '막힘 응답이 많은 구간을 중심으로 재시연합니다.',
      timingLabel: '2분',
    },
  },
  {
    id: 'ethics-question',
    label: '윤리 질문 추가',
    description: '활용 사례와 책임, 한계를 함께 점검합니다.',
    seed: {
      phase: 'ethics',
      interactionType: 'ethics-case',
      purpose: 'reflection',
      inputType: 'text',
      visibility: 'public',
      title: '기술 활용의 주의점',
      prompt: '오늘 배운 기술을 실제로 사용할 때 가장 먼저 점검해야 할 책임이나 주의점을 적어보세요.',
      choices: [],
      maxLength: 300,
      presenterNote: '저작권, 개인정보, 안전, 오용 가능성 관점으로 답을 분류합니다.',
      timingLabel: '4분',
    },
  },
  {
    id: 'wrapup-question',
    label: '마무리 질문 추가',
    description: '오늘 배운 내용과 다음 행동을 정리합니다.',
    seed: {
      phase: 'wrapup',
      interactionType: 'exit-ticket',
      purpose: 'reflection',
      inputType: 'text',
      visibility: 'public',
      title: '오늘 배운 것 한 줄 정리',
      prompt: '오늘 배운 내용 중 가장 기억에 남는 점이나 다음 시간 전에 해보고 싶은 것을 적어보세요.',
      choices: [],
      maxLength: 300,
      presenterNote: '다음 차시 연결 문장으로 몇 개를 직접 읽어 주면 좋습니다.',
      timingLabel: '3분',
    },
  },
];
