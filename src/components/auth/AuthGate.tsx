/**
 * Presenter-app gate. Wraps every presenter route (everything except /student).
 *
 * - disabled  : env not configured -> render through (dev/preview escape hatch)
 * - loading   : resolving session -> spinner
 * - anonymous : auto-redirect to DoroGate login
 * - forbidden : authenticated but not a presenter role (e.g. student) -> 권한 없음
 * - error     : show message + retry
 * - authorized: render the app
 */
import { useEffect, type ReactNode } from 'react';
import { usePresenterAuth } from '../../auth/AuthProvider';

function CenteredCard({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f6faff',
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          background: '#fff',
          border: '1px solid #e5eefb',
          borderRadius: 20,
          padding: '40px 28px',
          boxShadow: '0 16px 40px rgba(15, 61, 138, 0.1)',
        }}
      >
        <h1 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#111827' }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, error, login, logout } = usePresenterAuth();

  useEffect(() => {
    if (status === 'anonymous') {
      void login();
    }
  }, [status, login]);

  if (status === 'disabled' || status === 'authorized') {
    return <>{children}</>;
  }

  if (status === 'forbidden') {
    return (
      <CenteredCard title="접근 권한이 없습니다">
        <p style={{ margin: '0 0 20px', color: '#5f6b7a', lineHeight: 1.6 }}>
          이 화면은 강사·운영자 전용입니다. 학생은 수업에서 받은 참여 링크로 접속해주세요.
        </p>
        <button type="button" onClick={() => void logout()} style={primaryBtn}>
          다른 계정으로 로그인
        </button>
      </CenteredCard>
    );
  }

  if (status === 'error') {
    return (
      <CenteredCard title="로그인 중 문제가 발생했습니다">
        <p style={{ margin: '0 0 20px', color: '#5f6b7a', lineHeight: 1.6 }}>{error ?? '잠시 후 다시 시도해주세요.'}</p>
        <button type="button" onClick={() => void login()} style={primaryBtn}>
          다시 로그인
        </button>
      </CenteredCard>
    );
  }

  // loading | anonymous(redirecting): no interstitial — redirect happens immediately
  return null;
}

const primaryBtn: React.CSSProperties = {
  height: 48,
  padding: '0 20px',
  width: '100%',
  border: 'none',
  borderRadius: 14,
  background: '#2563eb',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};
