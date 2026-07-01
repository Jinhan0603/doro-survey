import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Info,
  ListChecks,
  Lock,
  MonitorPlay,
  Pencil,
  Plus,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Timestamp } from 'firebase/firestore';
import { usePresenterAuth } from '../auth/AuthProvider';
import { useMySessions } from '../hooks/useMySessions';
import { useQuestions } from '../hooks/useQuestions';
import { useToasts } from '../hooks/useToasts';
import { ToastStack } from '../components/common/Toast';
import { countAnswersForQuestions } from '../firebase/answers';
import {
  closeSession,
  deleteSessionCascade,
  reopenSession,
  type SessionSummary,
} from '../firebase/sessions';
import type { QuestionDoc } from '../firebase/types';
import { getQuestionResultVisibility, getQuestionTypeLabel } from '../utils/questionRuntime';
import { buildAppUrl } from '../utils/urls';
import '../styles/sessions-dashboard.css';

function formatCreatedFull(ts: Timestamp | null | undefined): string {
  if (!ts) return '생성일 미상';
  try {
    const date = ts.toDate();
    if (Number.isNaN(date.getTime())) return '생성일 미상';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '생성일 미상';
  }
}

function formatCreatedShort(ts: Timestamp | null | undefined): string {
  if (!ts) return '미상';
  try {
    const date = ts.toDate();
    if (Number.isNaN(date.getTime())) return '미상';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  } catch {
    return '미상';
  }
}

function getQuestionVisibilityLabel(question: QuestionDoc): string {
  return getQuestionResultVisibility(question) === 'public' ? '공개' : '비공개';
}

function SessionDetail({
  session,
  questions,
  answerCounts,
  deleting,
  toggling,
  onEdit,
  onDelete,
  onToggleAccepting,
  onOpenResult,
  onOpenLive,
  onCopyLink,
  onOpenStudent,
}: {
  session: SessionSummary;
  questions: QuestionDoc[];
  answerCounts: Record<string, number>;
  deleting: boolean;
  toggling: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAccepting: () => void;
  onOpenResult: () => void;
  onOpenLive: () => void;
  onCopyLink: () => void;
  onOpenStudent: () => void;
}) {
  const surveyTitle = session.title?.trim() || '제목 없는 설문';
  const isCollecting = session.accepting;
  // 세션 상단 상태/버튼은 종료(closed) 여부를 따른다(질문 열림 accepting과 분리).
  const isClosed = session.closed;
  const statusLabel = isClosed ? '종료됨' : '진행 중';
  const createdAtLabel = formatCreatedFull(session.createdAt);
  const createdShort = formatCreatedShort(session.createdAt);
  const questionCount = questions.length;
  const responseCount = questions.reduce((sum, question) => sum + (answerCounts[question.id] ?? 0), 0);
  const studentJoinUrl = buildAppUrl('/student', session.id);

  const sortedQuestions = [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      <header className="sessionDetailHeader">
        <div className="sessionDetailTitleBlock">
          <p className="detailEyebrow">
            <Info size={16} />
            설문 정보
          </p>

          <h2>{surveyTitle}</h2>

          <div className="sessionDetailBadges">
            <span className={!isClosed ? 'statusBadge isCollecting' : 'statusBadge isClosed'}>
              <Clock size={15} />
              {statusLabel}
            </span>

            <span className="neutralBadge">
              <Calendar size={15} />
              생성일 {createdAtLabel}
            </span>
          </div>
        </div>

        <div className="sessionHeaderActions">
          <button
            type="button"
            className={`detailToggleButton ${!isClosed ? 'isClose' : 'isOpen'}`}
            disabled={toggling}
            onClick={onToggleAccepting}
          >
            {!isClosed ? <Lock size={16} /> : <Unlock size={16} />}
            {!isClosed ? '종료하기' : '수집 재개'}
          </button>
          <button type="button" className="detailSecondaryButton" onClick={onEdit}>
            <Pencil size={17} />
            편집
          </button>
          <button
            type="button"
            className="detailDangerButton"
            disabled={deleting}
            onClick={onDelete}
          >
            <Trash2 size={17} />
            삭제
          </button>
        </div>
      </header>

      <div className="sessionDetailBody">
        <section className="studentEntryCard">
          <div className="studentEntryContent">
            <div className="studentQrBox" aria-label="학생 입장 QR 코드">
              <QRCodeSVG bgColor="#f8fafc" fgColor="#161513" includeMargin size={132} value={studentJoinUrl} />
            </div>

            <div className="studentLinkArea">
              <label htmlFor="studentJoinUrl">학생 입장 링크</label>
              <input
                id="studentJoinUrl"
                value={studentJoinUrl}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />

              <div className="studentLinkActions">
                <button type="button" className="linkActionButton" onClick={onCopyLink}>
                  <Copy size={16} />
                  링크 복사
                </button>
                <button type="button" className="linkActionButton" onClick={onOpenStudent}>
                  <ExternalLink size={16} />
                  학생 화면 열기
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="sessionDetailGrid">
          <div className="sessionDetailMain">
            <section className="questionPreviewSection">
              <div className="sectionTitleRow">
                <h3>질문 미리보기</h3>
                <span>{questionCount}개 질문</span>
              </div>

              {questionCount > 0 ? (
                <div className="questionPreviewList">
                  {sortedQuestions.map((question, index) => (
                    <article className="questionPreviewCard" key={question.id ?? index}>
                      <span className="questionNumberBadge">Q{String(index + 1).padStart(2, '0')}</span>
                      <div className="questionPreviewContent">
                        <strong>{question.title || `질문 ${index + 1}`}</strong>
                        <p>
                          {getQuestionTypeLabel(question)}
                          {' · '}
                          {getQuestionVisibilityLabel(question)}
                          {' · '}
                          응답 {answerCounts[question.id] ?? 0}개
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="emptyInfoBox">등록된 질문이 없습니다.</div>
              )}
            </section>
          </div>

          <aside className="sessionDetailAside">
            <section className="summaryCard">
              <h3>요약 정보</h3>

              <dl className="summaryGrid">
                <div className="summaryTile">
                  <dt>
                    <Users size={17} />
                    응답 상태
                  </dt>
                  <dd className={isCollecting ? 'summaryValueGreen' : ''}>
                    {isCollecting ? '수집 중' : '마감'}
                  </dd>
                </div>

                <div className="summaryTile">
                  <dt>
                    <BarChart3 size={17} />
                    응답 수
                  </dt>
                  <dd>{responseCount}개</dd>
                </div>

                <div className="summaryTile">
                  <dt>
                    <ListChecks size={17} />
                    질문 수
                  </dt>
                  <dd>{questionCount}개</dd>
                </div>

                <div className="summaryTile">
                  <dt>
                    <Calendar size={17} />
                    생성일
                  </dt>
                  <dd>{createdShort}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>

      <footer className="sessionDetailFooter">
        <button type="button" className="secondaryFooterButton" onClick={onOpenResult}>
          <BarChart3 size={17} />
          결과 화면
        </button>
        <button type="button" className="primaryFooterButton" onClick={onOpenLive}>
          <MonitorPlay size={17} />
          진행 화면 열기
        </button>
      </footer>
    </>
  );
}

function SessionsDashboardContent({ ownerUid }: { ownerUid: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('selected');
  const appliedRequestedRef = useRef(false);
  const { sessions, loading, error } = useMySessions(ownerUid);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerCounts, setAnswerCounts] = useState<Record<string, number>>({});
  const { toasts, pushToast } = useToasts();

  const selected = sessions.find((session) => session.id === selectedId) ?? null;
  const { questions } = useQuestions(selected?.id ?? '', { enabled: Boolean(selected) });
  const selectedSessionId = selected?.id ?? null;
  const questionIdsKey = questions.map((question) => question.id).join(',');

  // 선택한 설문의 질문별 응답 수를 count 쿼리로 집계한다(문서 다운로드 없이 개수만).
  useEffect(() => {
    const questionIds = questionIdsKey ? questionIdsKey.split(',') : [];
    if (!selectedSessionId || questionIds.length === 0) {
      setAnswerCounts({});
      return;
    }
    let cancelled = false;
    countAnswersForQuestions(selectedSessionId, questionIds)
      .then((counts) => {
        if (!cancelled) setAnswerCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setAnswerCounts({});
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSessionId, questionIdsKey]);

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
      return;
    }
    if (!sessions.some((session) => session.id === selectedId)) {
      setSelectedId(sessions[0].id);
    }
  }, [sessions, selectedId, requestedId]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" 설문을 삭제할까요?\n질문과 응답이 모두 영구 삭제되며 되돌릴 수 없습니다.`)) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteSessionCascade(id);
      pushToast('설문을 삭제했습니다.', 'success');
    } catch (err) {
      pushToast(err instanceof Error ? err.message : '설문 삭제에 실패했습니다.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAccepting = async (session: SessionSummary) => {
    try {
      setTogglingId(session.id);
      if (session.closed) {
        await reopenSession(session.id);
        pushToast('설문을 다시 열었습니다. 실시간 운영에서 질문을 여세요.', 'success');
      } else {
        await closeSession(session.id, questions.map((question) => question.id));
        pushToast('설문을 종료했습니다.', 'success');
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : '상태 변경에 실패했습니다.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCopyStudentLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      pushToast('학생 입장 링크를 복사했습니다.', 'success');
    } catch {
      pushToast('링크 복사에 실패했습니다.', 'error');
    }
  };

  const handleOpenStudentPage = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="sessionsPage">
      <div className="sessionsShell">
        <header className="sessionsToolbar">
          <h1>진행 중인 설문</h1>
          <Link className="createSurveyButton" to="/custom-session">
            <Plus size={16} />
            새 설문 만들기
          </Link>
        </header>

        {error ? <div className="inline-message inline-message--error sessionsError">{error}</div> : null}

        <section className="sessionsWorkspace">
          <aside className="sessionListPanel">
            <header className="sessionListHeader">
              <h2>설문 목록</h2>
              <span>{sessions.length}</span>
            </header>

            <div className="sessionListScroll">
              {loading ? null : sessions.length === 0 ? (
                <div className="sessionListEmpty">
                  <FileText size={22} />
                  <strong>아직 만든 설문이 없습니다.</strong>
                </div>
              ) : (
                sessions.map((session) => {
                  const isSelected = session.id === selectedId;
                  const isClosed = session.closed;
                  const statusLabel = isClosed ? '종료됨' : '진행 중';
                  return (
                    <button
                      key={session.id}
                      type="button"
                      className={`sessionListItem ${isSelected ? 'isSelected' : ''}`}
                      onClick={() => setSelectedId(session.id)}
                    >
                      <span className="sessionListIcon">
                        <FileText size={17} />
                      </span>
                      <span className="sessionListText">
                        <strong>{session.title?.trim() || '제목 없는 설문'}</strong>
                        <span>
                          <span className={`inlineStatusDot ${!isClosed ? '' : 'isClosed'}`} />
                          {statusLabel} · {formatCreatedFull(session.createdAt)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="sessionDetailPanel">
            {selected ? (
              <SessionDetail
                session={selected}
                questions={questions}
                answerCounts={answerCounts}
                deleting={deletingId === selected.id}
                toggling={togglingId === selected.id}
                onEdit={() => navigate(`/custom-session/${selected.id}`)}
                onDelete={() => void handleDelete(selected.id, selected.title)}
                onToggleAccepting={() => void handleToggleAccepting(selected)}
                onOpenResult={() => navigate(`/display?session=${selected.id}`)}
                onOpenLive={() => navigate(`/admin?session=${selected.id}`)}
                onCopyLink={() => void handleCopyStudentLink(buildAppUrl('/student', selected.id))}
                onOpenStudent={() => handleOpenStudentPage(buildAppUrl('/student', selected.id))}
              />
            ) : (
              <div className="sessionDetailEmpty">
                <Info size={44} />
                <h2>설문을 선택하세요</h2>
                <p>왼쪽 목록에서 진행 중인 설문을 선택하면 상세 정보가 표시됩니다.</p>
              </div>
            )}
          </section>
        </section>
      </div>

      <ToastStack toasts={toasts} />
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
