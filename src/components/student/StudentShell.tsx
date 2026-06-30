import { type ReactNode } from 'react';
import { Badge } from '../common/Badge';

// Slim mobile header for student screens
export function StudentShell({
  sessionId,
  isPreview = false,
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
          <span className="brand-mark__tile">D</span>
          <span className="student-header__name">DORO Live Survey</span>
        </div>
        <div>
          {isPreview ? (
            <Badge>미리보기</Badge>
          ) : sessionId ? (
            <Badge tone="accent">{sessionId}</Badge>
          ) : null}
        </div>
      </header>
      <main className="student-main">{children}</main>
    </div>
  );
}
