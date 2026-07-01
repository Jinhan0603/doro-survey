import { type ReactNode } from 'react';
import { BrandLogo } from '../home/ui/BrandLogo';

// Slim mobile header for student screens.
// 브랜드(로고 + 'DORO 실시간 설문 시스템')만 노출한다. 탭·프로필·세션 배지는 없다.
// sessionId/isPreview는 호출부 호환을 위해 받되 헤더에는 표시하지 않는다.
export function StudentShell({
  children,
}: {
  sessionId?: string;
  isPreview?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="student-shell">
      <header className="student-header">
        <div className="student-header__brand">
          <span className="student-header__logo">
            <BrandLogo size={30} />
          </span>
          <span className="student-header__name">DORO 실시간 설문 시스템</span>
        </div>
      </header>
      <main className="student-main">{children}</main>
    </div>
  );
}
