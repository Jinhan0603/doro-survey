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
    type: 'text',
    title: '삶의 목표 한 문장',
    prompt: '강의 초반 질문입니다. 여러분은 죽을 때 어떤 사람으로 기억되고 싶나요?',
    maxLength: 120,
  },
  {
    id: 'q05',
    order: 5,
    type: 'choice',
    title: '행사는 끝났다, 이제 수익화는?',
    prompt: '체험 행사가 끝난 뒤 “사람들은 좋아했다”에서 끝나지 않으려면 다음 단계는 무엇이어야 할까요?',
    choices: [
      '유료 교육 프로그램으로 전환',
      '입장료 있는 행사 반복',
      '로봇 제품 판매로 연결',
      '기업 협업 행사로 확장',
      '반응만 확인하고 종료',
    ],
  },
  {
    id: 'q12',
    order: 12,
    type: 'text',
    title: '7일 안의 도전',
    prompt: '강의 마지막 질문입니다. 오늘 듣고 7일 안에 해볼 수 있는 가장 작은 도전을 적어보세요.',
    maxLength: 200,
  },
];

export const previewChartData = [
  { name: '유료 교육 프로그램으로 전환', value: 9 },
  { name: '입장료 있는 행사 반복', value: 3 },
  { name: '로봇 제품 판매로 연결', value: 4 },
  { name: '기업 협업 행사로 확장', value: 2 },
  { name: '반응만 확인하고 종료', value: 1 },
];

export const previewTextAnswers = [
  { nickname: '민준', answer: '학교 후배 3명과 이번 주 안에 작은 로봇 체험 수업을 기획해 보겠습니다.' },
  { nickname: '서연', answer: '제가 잘하는 설명을 바탕으로 10분짜리 교육 콘텐츠 한 편을 직접 만들어 보겠습니다.' },
  { nickname: '지후', answer: '우리 학과에서 불편한 문제 하나를 적고, 그걸 해결할 수 있는 서비스를 떠올려 보겠습니다.' },
];

export const previewAnswerRows = [
  { id: 'preview-1', nickname: '민준', answer: '유료 교육 프로그램으로 전환', submittedAt: '14:08', statusLabel: '표시 가능' },
  { id: 'preview-2', nickname: '서연', answer: '로봇 제품 판매로 연결', submittedAt: '14:09', statusLabel: '표시 가능' },
  { id: 'preview-3', nickname: '하은', answer: '기업 협업 행사로 확장', submittedAt: '14:09', statusLabel: '표시 가능' },
  { id: 'preview-4', nickname: '지후', answer: '반응만 확인하고 종료', submittedAt: '14:10', statusLabel: '검토 필요' },
];
