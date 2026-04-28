export type PreviewQuestion = {
  id: string;
  order: number;
  type: 'choice' | 'text';
  title: string;
  prompt: string;
  choices?: string[];
  maxLength?: number;
};

export const previewSessionId = 'ai-maker-lab-2026';

export const previewQuestions: PreviewQuestion[] = [
  {
    id: 'q01',
    order: 1,
    type: 'text',
    title: '오늘 가장 기대되는 활동',
    prompt: '오늘 기술 수업에서 가장 기대되는 활동이나 만들어보고 싶은 것을 한 줄로 적어보세요.',
    maxLength: 120,
  },
  {
    id: 'q05',
    order: 5,
    type: 'choice',
    title: '프롬프트 실습 중간 체크',
    prompt: '이미지 생성 결과가 원하는 방향과 다를 때 가장 먼저 조정할 요소는 무엇일까요?',
    choices: ['핵심 키워드', '스타일 설명', '구도/배치', '부정 프롬프트', '반복 생성 횟수'],
  },
  {
    id: 'q12',
    order: 12,
    type: 'text',
    title: '다음 시간 전 도전',
    prompt: '오늘 배운 기술을 바탕으로 다음 시간 전까지 직접 해볼 가장 작은 실험을 적어보세요.',
    maxLength: 200,
  },
];

export const previewChartData = [
  { name: '핵심 키워드', value: 8 },
  { name: '스타일 설명', value: 4 },
  { name: '구도/배치', value: 5 },
  { name: '부정 프롬프트', value: 2 },
  { name: '반복 생성 횟수', value: 1 },
];

export const previewTextAnswers = [
  { nickname: '민준', answer: '오늘은 같은 주제로 프롬프트를 세 번 바꿔서 결과 차이를 비교해 보고 싶습니다.' },
  { nickname: '서연', answer: '이미지 생성 도구와 발표 자료를 연결해서 짧은 결과물을 완성해 보고 싶습니다.' },
  { nickname: '지후', answer: 'AI로 만든 결과를 그대로 쓰지 않고 어떻게 수정해야 하는지 실습해 보고 싶습니다.' },
];

export const previewAnswerRows = [
  { id: 'preview-1', nickname: '민준', answer: '핵심 키워드', submittedAt: '14:08', statusLabel: '표시 가능' },
  { id: 'preview-2', nickname: '서연', answer: '구도/배치', submittedAt: '14:09', statusLabel: '표시 가능' },
  { id: 'preview-3', nickname: '하은', answer: '스타일 설명', submittedAt: '14:09', statusLabel: '표시 가능' },
  { id: 'preview-4', nickname: '지후', answer: '부정 프롬프트', submittedAt: '14:10', statusLabel: '검토 필요' },
];
