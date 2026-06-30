/**
 * Layout + authenticated-user provider for presenter authoring pages
 * (template library/builder, session creation).
 *
 * Authentication itself is handled upstream by AuthGate (DoroGate SSO), and the
 * users/{uid} profile is provisioned server-side by the exchangeToken function.
 * So this no longer renders a login form — it just supplies the signed-in
 * Firebase user to its children, or a fallback when the gate is bypassed
 * (env not configured).
 */
import { type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { usePresenterAuth } from '../../auth/AuthProvider';
import { Card } from '../common/Card';
import { AppShell } from '../layout/AppShell';
import { WaitingState } from '../survey/WaitingState';

type TeacherGateProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  compact?: boolean;
  /** @deprecated kept for call-site compatibility; no longer rendered. */
  loginAside?: ReactNode;
  actions?: (user: User) => ReactNode;
  children: (user: User) => ReactNode;
};

export function TeacherGate({
  title,
  eyebrow,
  description,
  compact = true,
  actions,
  children,
}: TeacherGateProps) {
  const { status, user } = usePresenterAuth();

  if (status === 'loading') {
    return (
      <AppShell compact={compact} description={description} eyebrow={eyebrow} title={title}>
        <WaitingState title="인증 확인 중..." description="잠시만 기다려주세요." />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell compact={compact} description={description} eyebrow={eyebrow} title={title}>
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            이 화면은 로그인 후 이용할 수 있습니다.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      compact={compact}
      description={description}
      eyebrow={eyebrow}
      title={title}
      actions={actions?.(user)}
    >
      {children(user)}
    </AppShell>
  );
}
