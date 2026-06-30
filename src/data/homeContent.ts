import { previewSessionId } from './previewQuestions';

/** Visible class code shown across the homepage. */
export const CLASS_CODE = 'CLASS-2026';

/** Tone keys map to button/badge/link color variants. */
export type Tone = 'blue' | 'green' | 'purple';

export type NavItem = { label: string; to: string; active?: boolean };

export const navItems: NavItem[] = [
  { label: '홈', to: '/', active: true },
  { label: '내 수업', to: '/sessions' },
  { label: '질문 만들기', to: '/custom-session' },
  { label: '템플릿', to: '/library' },
  { label: '수업 열기', to: '/session-new' },
  { label: '참여 링크', to: `/student?session=${previewSessionId}` },
  { label: '진행 화면', to: `/admin?session=${previewSessionId}` },
  { label: '결과 화면', to: `/display?session=${previewSessionId}` },
];

export type FeatureCard = {
  title: string;
  description: string;
  action: string;
  to: string;
  tone: Tone;
  icon: 'pencil' | 'template' | 'play';
  emphasized?: boolean;
};

export const featureCards: FeatureCard[] = [
  {
    title: '새 질문 만들기',
    description: '객관식, 주관식, OX 질문을 바로 만들 수 있습니다.',
    action: '질문 만들기',
    to: '/custom-session',
    tone: 'blue',
    icon: 'pencil',
    emphasized: true,
  },
  {
    title: '수업 템플릿',
    description: '자주 쓰는 질문 묶음을 저장해 다음 수업에 다시 사용하세요.',
    action: '템플릿 만들기',
    to: '/builder',
    tone: 'green',
    icon: 'template',
  },
  {
    title: '수업 열기',
    description: '저장한 템플릿으로 학생 참여 링크를 만들고 수업을 시작합니다.',
    action: '수업 열기',
    to: '/session-new',
    tone: 'purple',
    icon: 'play',
  },
];

export type OperationCard = {
  title: string;
  description: string;
  action: string;
  to: string;
  image: string;
  alt: string;
};

export const operationCards: OperationCard[] = [
  {
    title: '학생 참여 화면',
    description: '학생은 링크나 QR 코드로 접속해 질문에 응답합니다.',
    action: '참여 링크 보기',
    to: `/student?session=${previewSessionId}`,
    image: '/images/student-join.png',
    alt: '학생 참여 링크와 QR 코드를 보여주는 휴대폰 일러스트',
  },
  {
    title: '교사용 진행 화면',
    description: '응답 현황을 확인하고 질문 진행과 결과 공개를 관리합니다.',
    action: '진행 화면 열기',
    to: `/admin?session=${previewSessionId}`,
    image: '/images/teacher-dashboard.png',
    alt: '교사용 진행 화면 대시보드 일러스트',
  },
  {
    title: '결과 공유 화면',
    description: '교실 화면이나 프로젝터에 응답 결과를 크게 보여줍니다.',
    action: '공유 화면 열기',
    to: `/display?session=${previewSessionId}`,
    image: '/images/result-display.png',
    alt: '결과 공유 화면 차트 일러스트',
  },
];

export const workflowSteps: string[] = [
  '질문을 만들거나 템플릿을 선택합니다.',
  '학생 참여 링크를 생성합니다.',
  '링크 또는 QR 코드를 학생에게 공유합니다.',
  '교사용 진행 화면에서 응답을 확인합니다.',
  '결과 공유 화면으로 전체 응답을 보여줍니다.',
  '수업이 끝나면 결과를 저장하거나 다음 수업을 엽니다.',
];

export const shareChecks: string[] = [
  '학생에게는 학생 참여 링크만 공유하세요.',
  '교사용 진행 화면은 수업 진행자만 사용하세요.',
  '결과 공유 화면은 교실 화면에만 표시하세요.',
  '수업마다 새 수업 코드를 사용하세요.',
];
