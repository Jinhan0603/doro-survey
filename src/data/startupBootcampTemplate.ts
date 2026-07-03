import type { TemplateVisibility } from '../firebase/types';
import type { InteractionSeed } from './lessonTemplatePresets';

// 창업 부트캠프 전체 공유 템플릿.
// 5개 질문 모두 객관식(choice) · 결과 공개(public)이며,
// 도입 → 이론 → 실습 → 실습 → 마무리 흐름으로 배치한다.
// interactionType/purpose는 inferInteractionType/inferPurpose(sessions.ts) 규칙과 일치시켜,
// 빌더로 불러오든 별도 시드로 쓰든 동일한 결과가 되도록 한다.
// 각 질문의 '의도'는 진행자 참고용이라 저장하지 않는다(presenterNote는 빈 값).

export type FullTemplatePreset = {
  title: string;
  subject: string;
  description: string;
  targetGrade: string;
  toolTags: string[];
  templateVisibility: TemplateVisibility;
  interactions: InteractionSeed[];
};

export const STARTUP_BOOTCAMP_TEMPLATE: FullTemplatePreset = {
  title: '창업 부트캠프 — 두려움에서 첫 매출까지',
  subject: '창업/기업가정신',
  description:
    '실패에 대한 두려움을 열고 고객·결제 관점으로 전환한 뒤, 24시간 안에 작게 팔아보고 첫 매출 이후 수익성을 점검하며, 72시간 실행 약속으로 마무리하는 창업 부트캠프용 5문항 세트.',
  targetGrade: '',
  toolTags: [],
  templateVisibility: 'shared',
  interactions: [
    {
      phase: 'intro',
      interactionType: 'prior-knowledge',
      purpose: 'learning',
      inputType: 'choice',
      visibility: 'public',
      title: '창업에서 가장 두려운 것',
      prompt: '지금 우리 팀이 창업에서 가장 두려운 것은 무엇인가요?',
      choices: ['실패', '아이디어가 약함', '고객을 못 만남', '팀 갈등', '판매가 두려움', '돈이 안 남을까 봐'],
      maxLength: 300,
      presenterNote: '',
      timingLabel: '',
    },
    {
      phase: 'theory',
      interactionType: 'concept-check',
      purpose: 'learning',
      inputType: 'choice',
      visibility: 'public',
      title: '좋아하는 것 vs 돈 내는 것',
      prompt: '사람들이 좋아하는 것과 돈을 내는 것은 왜 다를까요?',
      choices: ['재미는 있지만 필요하지 않음', '돈 낼 고객이 다름', '가격이 없음', '반복 구매가 안 됨', '문제 해결이 약함'],
      maxLength: 300,
      presenterNote: '',
      timingLabel: '',
    },
    {
      phase: 'practice',
      interactionType: 'progress-check',
      purpose: 'learning',
      inputType: 'choice',
      visibility: 'public',
      title: "24시간 안에 '작게라도' 팔 수 있는 것",
      prompt: "여러분 팀이 24시간 안에 '작게라도' 팔 수 있는 것은 무엇인가요?",
      choices: ['사전예약', '1회 체험', '컨설팅', '샘플 제작', '유료 인터뷰', '아직 없음'],
      maxLength: 300,
      presenterNote: '',
      timingLabel: '',
    },
    {
      phase: 'practice',
      interactionType: 'progress-check',
      purpose: 'learning',
      inputType: 'choice',
      visibility: 'public',
      title: '첫 매출 이후 먼저 고칠 것',
      prompt: '첫 매출 이후 가장 먼저 고쳐야 할 것은 무엇일까요?',
      choices: ['가격', '원가', '고객획득비', '재구매', '운영시간', '품질·안전', '팀 역할'],
      maxLength: 300,
      presenterNote: '',
      timingLabel: '',
    },
    {
      phase: 'wrapup',
      interactionType: 'exit-ticket',
      purpose: 'reflection',
      inputType: 'choice',
      visibility: 'public',
      title: '72시간 안에 할 행동',
      prompt: '강의 후 72시간 안에 여러분 팀이 할 행동은 무엇인가요?',
      choices: ['고객 5명 인터뷰', '1만원 판매 실험', '가격표 만들기', '랜딩페이지 만들기', '기능 하나 버리기', '팀 역할 다시 정하기'],
      maxLength: 300,
      presenterNote: '',
      timingLabel: '',
    },
  ],
};
