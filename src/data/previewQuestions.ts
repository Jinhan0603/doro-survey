export type PreviewQuestion = {
  id: string;
  order: number;
  type: 'choice' | 'text';
  title: string;
  prompt: string;
  choices?: string[];
  maxLength?: number;
};

export const previewSessionId = 'robot-startup-2026';

export const previewQuestions: PreviewQuestion[] = [
  {
    id: 'q01',
    order: 1,
    type: 'choice',
    title: '로봇으로 창업한다면?',
    prompt: '여러분이 로봇으로 창업한다면 가장 먼저 무엇을 팔겠나요?',
    choices: ['로봇 제품', '로봇 교육', '로봇 체험 행사', '로봇 대회 준비', '아직 모르겠다'],
  },
  {
    id: 'q05',
    order: 5,
    type: 'choice',
    title: '로봇이 없는 로봇 행사',
    prompt: '로봇 체험 행사를 열기로 했는데, 정작 체험시킬 로봇이 없습니다. 여러분이라면?',
    choices: [
      '행사를 취소한다',
      '직접 급하게 만든다',
      '로봇 기업에 연락해 빌린다',
      '강연형 행사로 바꾼다',
      '팀원을 더 모은다',
    ],
  },
  {
    id: 'q09',
    order: 9,
    type: 'text',
    title: '내 전공으로 돈 벌기',
    prompt: '여러분의 전공이나 경험으로 지금 당장 10만 원이라도 받을 수 있는 것은 무엇인가요?',
    maxLength: 200,
  },
];

export const previewChartData = [
  { name: '취소', value: 2 },
  { name: '직접 제작', value: 4 },
  { name: '기업 협업', value: 9 },
  { name: '강연 전환', value: 3 },
  { name: '팀원 확장', value: 2 },
];

export const previewTextAnswers = [
  { nickname: '민준', answer: '초등학생 대상 아두이노 기초 수업을 바로 열 수 있어요.' },
  { nickname: '서연', answer: '제가 만든 로봇 키트 조립 영상을 짧게 편집해서 판매해보고 싶어요.' },
  { nickname: '지후', answer: '행사 진행 보조와 체험 운영 가이드를 서비스로 만들 수 있습니다.' },
];

export const previewAnswerRows = [
  { id: 'preview-1', nickname: '민준', answer: '로봇 기업에 연락해 빌린다', submittedAt: '14:08', statusLabel: '표시 가능' },
  { id: 'preview-2', nickname: '서연', answer: '직접 급하게 만든다', submittedAt: '14:09', statusLabel: '표시 가능' },
  { id: 'preview-3', nickname: '하은', answer: '강연형 행사로 바꾼다', submittedAt: '14:09', statusLabel: '표시 가능' },
  { id: 'preview-4', nickname: '지후', answer: '팀원을 더 모은다', submittedAt: '14:10', statusLabel: '검토 필요' },
];
