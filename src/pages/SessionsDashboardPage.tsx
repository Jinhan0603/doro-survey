import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';
import { TeacherGate } from '../components/teacher/TeacherGate';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { WaitingState } from '../components/survey/WaitingState';
import { useMySessions } from '../hooks/useMySessions';
import { deleteSessionCascade } from '../firebase/sessions';
import { buildAppUrl } from '../utils/urls';

function formatCreated(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleString('ko-KR');
  } catch {
    return '';
  }
}

function SessionsDashboardContent({ ownerUid }: { ownerUid: string }) {
  const navigate = useNavigate();
  const { sessions, loading, error } = useMySessions(ownerUid);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const copyStudentLink = (id: string) => {
    navigator.clipboard.writeText(buildAppUrl('/student', id)).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" 수업을 삭제할까요?\n질문과 응답이 모두 영구 삭제되며 되돌릴 수 없습니다.`)) {
      return;
    }
    try {
      setDeletingId(id);
      setDeleteError(null);
      await deleteSessionCascade(id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '수업 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="stack">
      <Card>
        <div className="section-heading">
          <h3>새 수업 시작</h3>
        </div>
        <p>수업을 만들면 학생 참여 링크가 생성되고, 아래 목록에서 진행·결과 화면을 열 수 있습니다.</p>
        <div className="hero-actions">
          <Button size="sm" onClick={() => navigate('/custom-session')}>
            새 질문으로 시작
          </Button>
          <Button size="sm" variant="secondary" onClick={() => navigate('/session-new')}>
            템플릿으로 시작
          </Button>
        </div>
      </Card>

      {deleteError ? <Card className="banner-card banner-card--error">{deleteError}</Card> : null}

      {loading ? (
        <WaitingState title="수업을 불러오는 중입니다" description="잠시만 기다려주세요." />
      ) : error ? (
        <Card className="banner-card banner-card--error">{error}</Card>
      ) : sessions.length === 0 ? (
        <Card className="banner-card">
          아직 만든 수업이 없습니다. 위에서 새 수업을 만들어보세요.
        </Card>
      ) : (
        sessions.map((session) => (
          <Card key={session.id}>
            <div className="section-heading">
              <h3>{session.title}</h3>
              <Badge tone={session.accepting ? 'success' : 'default'}>
                {session.accepting ? '응답 수집 중' : '대기'}
              </Badge>
            </div>
            <p>
              수업 코드 <strong>{session.id}</strong>
              {formatCreated(session.createdAt) ? ` · ${formatCreated(session.createdAt)} 생성` : ''}
            </p>
            <div className="hero-actions">
              <Button size="sm" onClick={() => navigate(`/admin?session=${session.id}`)}>
                진행 화면
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/display?session=${session.id}`)}>
                결과 화면
              </Button>
              <Button size="sm" variant="ghost" onClick={() => copyStudentLink(session.id)}>
                {copiedId === session.id ? '복사됨' : '학생 링크 복사'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={deletingId === session.id}
                onClick={() => void handleDelete(session.id, session.title)}
              >
                {deletingId === session.id ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

export function SessionsDashboardPage() {
  return (
    <TeacherGate title="내 수업" eyebrow="DORO Live Survey" description="내가 만든 수업을 관리합니다.">
      {(user) => <SessionsDashboardContent ownerUid={user.uid} />}
    </TeacherGate>
  );
}
