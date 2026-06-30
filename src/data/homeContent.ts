export type NavItem = { label: string; to: string };

/**
 * 헤더 전역 내비게이션. 홈은 '내 수업' 대시보드로 진입하므로 별도 항목을 두지 않는다.
 * 참여 링크·진행 화면·결과 화면은 설문(세션)마다 다르므로 전역 탭이 아니라
 * '내 수업'의 각 수업 카드에서 연다.
 */
export const navItems: NavItem[] = [
  { label: '내 수업', to: '/sessions' },
  { label: '질문 만들기', to: '/custom-session' },
  { label: '템플릿', to: '/library' },
  { label: '수업 열기', to: '/session-new' },
];
