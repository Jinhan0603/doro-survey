import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { usePresenterAuth } from '../auth/AuthProvider';
import { useMySessions } from '../hooks/useMySessions';
import { deleteSessionCascade, type SessionSummary } from '../firebase/sessions';
import { buildAppUrl } from '../utils/urls';
import '../styles/survey-builder.css';
import '../styles/template-builder.css';

function formatCreated(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  try {
    return ts.toDate().toLocaleString('ko-KR');
  } catch {
    return '';
  }
}

function SessionDetail({
  session,
  deleting,
  onOpenAdmin,
  onOpenDisplay,
  onCopyLink,
  onDelete,
}: {
  session: SessionSummary;
  deleting: boolean;
  onOpenAdmin: () => void;
  onOpenDisplay: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}) {
  const created = formatCreated(session.createdAt);

  return (
    <div className="templateDetail">
      <div className="templateDetail__labels">
        <Badge tone={session.accepting ? 'success' : 'default'}>
          {session.accepting ? '응답 수집 중' : '대기'}
        </Badge>
      </div>

      <h3 className="templateDetail__title">{session.title}</h3>

      <div className="templateDetail__meta">
        <span>설문 코드 {session.id}</span>
        {created ? <span>{created} 생성</span> : null}
      </div>

      <div className="templateDetail__actions">
        <Button size="sm" onClick={onOpenAdmin}>
          진행 화면
        </Button>
        <Button size="sm" variant="secondary" onClick={onOpenDisplay}>
          결과 화면
        </Button>
        <Button size="sm" variant="ghost" onClick={onCopyLink}>
          학생 링크 복사
        </Button>
        <Button size="sm" variant="ghost" disabled={deleting} onClick={onDelete}>
          삭제
        </Button>
      </div>
    </div>
  );
}

function SessionsDashboardContent({ ownerUid }: { ownerUid: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('selected');
  const appliedRequestedRef = useRef(false);
  const { sessions, loading, error } = useMySessions(ownerUid);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 모바일(≤960px)에서 목록/정보를 탭으로 전환한다.
  const [activePane, setActivePane] = useState<'meta' | 'questions'>('meta');

  const selected = sessions.find((session) => session.id === selectedId) ?? null;

  // 목록이 바뀌면 첫 항목을 자동 선택한다(삭제 후 선택 유지 포함).
  // 생성 직후 ?selected= 로 진입하면 해당 설문을 우선 선택한다(최초 1회).
  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedId(null);
      return;
    }
    if (
      requestedId &&
      !appliedRequestedRef.current &&
      sessions.some((session) => session.id === requestedId)
    ) {
      appliedRequestedRef.current = true;
      setSelectedId(requestedId);
      setActivePane('questions');
      return;
    }
    if (!sessions.some((session) => session.id === selectedId)) {
      setSelectedId(sessions[0].id);
    }
  }, [sessions, selectedId, requestedId]);

  const copyStudentLink = (id: string) => {
    void navigator.clipboard.writeText(buildAppUrl('/student', id));
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" 설문을 삭제할까요?\n질문과 응답이 모두 영구 삭제되며 되돌릴 수 없습니다.`)) {
      return;
    }
    try {
      setDeletingId(id);
      setDeleteError(null);
      await deleteSessionCascade(id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '설문 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setActivePane('questions');
  };

  return (
    <main className="templateBuilderPage">
      <div className="templateBuilderShell">
        <header className="templateBuilderToolbar">
          <h1>진행 중인 설문</h1>
          <div className="templateBuilderActions">
            <Link className="builder-link-button" to="/custom-session">
              <Plus size={16} />
              새 설문 만들기
            </Link>
          </div>
        </header>

        {error ? <div className="inline-message inline-message--error">{error}</div> : null}
        {deleteError ? <div className="inline-message inline-message--error">{deleteError}</div> : null}

        <div className="mobilePaneTabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activePane === 'meta'}
            className={`mobilePaneTab ${activePane === 'meta' ? 'isActive' : ''}`}
            onClick={() => setActivePane('meta')}
          >
            목록
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activePane === 'questions'}
            className={`mobilePaneTab ${activePane === 'questions' ? 'isActive' : ''}`}
            onClick={() => setActivePane('questions')}
          >
            정보
          </button>
        </div>

        <section className="templateBuilderWorkspace" data-active-pane={activePane}>
          <aside className="templateMetaPanel">
            <header className="builderPaneHeader">
              <h2>설문 목록</h2>
            </header>
            <div className="templateMetaScroll">
              {loading ? null : sessions.length === 0 ? (
                <div className="library-section__empty">
                  <ClipboardList size={20} />
                  <strong>아직 만든 설문이 없습니다.</strong>
                </div>
              ) : (
                <div className="templateList">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      className={`templateListRow ${session.id === selectedId ? 'isActive' : ''}`}
                      onClick={() => handleSelect(session.id)}
                    >
                      <strong>{session.title}</strong>
                      <span>
                        {session.accepting ? '응답 수집 중' : '대기'} · {session.id}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="questionBuilderPanel">
            <header className="questionBuilderHeader">
              <div className="builderPaneHeader">
                <h2>설문 정보</h2>
              </div>
            </header>
            <div className="questionBuilderScroll">
              {selected ? (
                <SessionDetail
                  session={selected}
                  deleting={deletingId === selected.id}
                  onOpenAdmin={() => navigate(`/admin?session=${selected.id}`)}
                  onOpenDisplay={() => navigate(`/display?session=${selected.id}`)}
                  onCopyLink={() => copyStudentLink(selected.id)}
                  onDelete={() => void handleDelete(selected.id, selected.title)}
                />
              ) : (
                <div className="library-section__empty">
                  <ClipboardList size={20} />
                  <strong>왼쪽에서 설문을 선택하세요.</strong>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export function SessionsDashboardPage() {
  const { user } = usePresenterAuth();
  if (!user) {
    return null;
  }
  return <SessionsDashboardContent ownerUid={user.uid} />;
}
