import { useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { signInAdminWithEmail } from '../../firebase/auth';
import { firebaseConfigStatus } from '../../firebase/client';
import {
  createOrUpdateUserProfile,
  DEFAULT_ORGANIZATION_ID,
  inferRoleFromEmail,
} from '../../firebase/users';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { AppShell } from '../layout/AppShell';
import { WaitingState } from '../survey/WaitingState';

type TeacherGateProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  compact?: boolean;
  loginAside?: ReactNode;
  actions?: (user: User) => ReactNode;
  children: (user: User) => ReactNode;
};

export function TeacherGate({
  title,
  eyebrow,
  description,
  compact = true,
  loginAside,
  actions,
  children,
}: TeacherGateProps) {
  const { user, loading } = useAuth();
  const hasTeacherAuth = Boolean(user?.email);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasTeacherAuth || !user?.email) {
      setProvisioning(false);
      setProvisionError(null);
      return;
    }

    let cancelled = false;
    setProvisioning(true);
    setProvisionError(null);

    void createOrUpdateUserProfile(user.uid, {
      email: user.email,
      displayName: user.displayName?.trim() || user.email.split('@')[0],
      role: inferRoleFromEmail(user.email),
      organizationId: DEFAULT_ORGANIZATION_ID,
    }).then(() => {
      if (!cancelled) {
        setProvisioning(false);
      }
    }).catch((error) => {
      if (!cancelled) {
        setProvisioning(false);
        setProvisionError(error instanceof Error ? error.message : '사용자 프로필 준비에 실패했습니다.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasTeacherAuth, user]);

  if (!firebaseConfigStatus.isConfigured) {
    return (
      <AppShell compact={compact} description={description} eyebrow={eyebrow} title={title}>
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Firebase 설정이 필요합니다.
          </p>
        </Card>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell compact={compact} description={description} eyebrow={eyebrow} title={title}>
        <WaitingState title="인증 확인 중..." description="잠시만 기다려주세요." />
      </AppShell>
    );
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) return;

    try {
      setBusy(true);
      setAuthError(null);
      await signInAdminWithEmail(email, password);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    } finally {
      setBusy(false);
    }
  };

  if (!hasTeacherAuth) {
    return (
      <AppShell compact={compact} description={description} eyebrow={eyebrow} title={title}>
        <div className="auth-layout">
          <Card className="login-card">
            <h2 className="login-card__heading">강사 로그인</h2>
            {user && !user.email ? (
              <p className="form-error">학생 익명 로그인 상태입니다. 강사 계정으로 다시 로그인해주세요.</p>
            ) : null}
            <Input
              autoComplete="email"
              label="이메일"
              name="teacher-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              autoComplete="current-password"
              label="비밀번호"
              name="teacher-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleLogin();
                }
              }}
            />
            {authError ? <p className="form-error">{authError}</p> : null}
            <Button disabled={busy} onClick={() => void handleLogin()}>
              {busy ? '로그인 중...' : '로그인'}
            </Button>
          </Card>
          {loginAside ?? (
            <Card className="banner-card">
              <h3>강사 계정 기능</h3>
              <p>
                템플릿 라이브러리와 빌더, 세션 생성 화면은 이메일 로그인 기반 강사/관리자 계정으로 접근합니다.
              </p>
            </Card>
          )}
        </div>
      </AppShell>
    );
  }

  if (provisioning) {
    return (
      <AppShell compact={compact} description={description} eyebrow={eyebrow} title={title}>
        <WaitingState title="강사 프로필 준비 중..." description="조직 권한을 확인하고 있습니다." />
      </AppShell>
    );
  }

  if (provisionError) {
    return (
      <AppShell compact={compact} description={description} eyebrow={eyebrow} title={title}>
        <Card className="banner-card banner-card--error">
          <p>{provisionError}</p>
        </Card>
      </AppShell>
    );
  }

  const teacherUser = user as User;

  return (
    <AppShell
      compact={compact}
      description={description}
      eyebrow={eyebrow}
      title={title}
      actions={actions?.(teacherUser)}
    >
      {children(teacherUser)}
    </AppShell>
  );
}
