import { previewSessionId } from './previewQuestions';

export type NavItem = { label: string; to: string };

/** 헤더 전역 내비게이션. 홈은 '내 수업' 대시보드로 진입하므로 별도 항목을 두지 않는다. */
export const navItems: NavItem[] = [
  { label: '내 수업', to: '/sessions' },
  { label: '질문 만들기', to: '/custom-session' },
  { label: '템플릿', to: '/library' },
  { label: '수업 열기', to: '/session-new' },
  { label: '참여 링크', to: `/student?session=${previewSessionId}` },
  { label: '진행 화면', to: `/admin?session=${previewSessionId}` },
  { label: '결과 화면', to: `/display?session=${previewSessionId}` },
];
