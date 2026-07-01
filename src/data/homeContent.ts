export type NavItem = {
  label: string;
  to: string;
  /** 이 탭을 active로 유지할 추가 경로(하위 화면). 예: 진행 중인 설문 → 진행/결과 화면. */
  matchPaths?: string[];
};

/**
 * 헤더 전역 내비게이션. 홈은 '내 수업' 대시보드로 진입하므로 별도 항목을 두지 않는다.
 * 참여 링크·진행 화면·결과 화면은 설문(세션)마다 다르므로 전역 탭이 아니라
 * '내 수업'의 각 수업 카드에서 연다.
 * '수업 열기'(/session-new)도 전역 탭에서 빼고, 템플릿 카드의 '세션 열기'로 진입한다.
 */
export const navItems: NavItem[] = [
  { label: '진행 중인 설문', to: '/sessions', matchPaths: ['/admin', '/display'] },
  { label: '설문 만들기', to: '/custom-session' },
  { label: '설문지 템플릿', to: '/templates' },
  { label: '템플릿 만들기', to: '/custom-template' },
];
