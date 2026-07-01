import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AdminPreview } from '../components/admin/AdminPreview';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ToastStack } from '../components/common/Toast';
import { AppShell } from '../components/layout/AppShell';
import {
  countAnswersForQuestions,
  deleteAnswersForQuestion,
  deleteAnswersForSession,
} from '../firebase/answers';
import { firebaseConfigStatus } from '../firebase/client';
import { closeQuestion, openQuestionExclusively, updateSession } from '../firebase/sessions';
import { usePresenterAuth } from '../auth/AuthProvider';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSessionId } from '../hooks/useSessionId';
import { useToasts } from '../hooks/useToasts';
import { formatTimestamp, getAnswerSummary } from '../utils/stats';
import { getQuestionResultVisibility, getQuestionTypeLabel } from '../utils/questionRuntime';
import { buildAppUrl } from '../utils/urls';
import '../styles/admin-live.css';

export function AdminPage() {
  const sessionId = useSessionId();
  // Auth is guaranteed by AuthGate (DoroGate SSO) before this page renders.
  const { user, role } = usePresenterAuth();
  const { profile } = useUserProfile(user?.uid);
  const firestoreEnabled = Boolean(user) && Boolean(sessionId);
  const { session, questions, activeQuestion, error } = useActiveQuestion(sessionId ?? '', {
    enabled: firestoreEnabled,
  });
  const { answers, error: answersError } = useAnswers(sessionId ?? '', activeQuestion?.id);
  const { toasts, pushToast } = useToasts();
  const [busy, setBusy] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  // 좌측 목록의 질문별 응답 수를 count 집계로 채운다(활성 질문은 실시간 answers로 대체).
  const questionIdsKey = questions.map((question) => question.id).join(',');
  useEffect(() => {
    const ids = questionIdsKey ? questionIdsKey.split(',') : [];
    if (!sessionId || ids.length === 0) {
      setQuestionCounts({});
      return;
    }
    let cancelled = false;
    countAnswersForQuestions(sessionId, ids)
      .then((counts) => {
        if (!cancelled) setQuestionCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setQuestionCounts({});
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, questionIdsKey]);

  if (!firebaseConfigStatus.isConfigured) {
    return <AdminPreview />;
  }

  if (!sessionId) {
    return (
      <AppShell compact title="실시간 운영">
        <Card className="banner-card">
          <p>운영할 설문을 먼저 선택하세요.</p>
          <Link to="/sessions">
            <Button size="sm">진행 중인 설문으로 이동</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  const studentJoinUrl = buildAppUrl('/student', sessionId);
  const canManageAnswerDocs = (role ?? profile?.role) === 'admin';

  const currentIndex = Math.max(
    0,
    questions.findIndex((question) => question.id === activeQuestion?.id),
  );
  const currentQuestionNumber = activeQuestion ? `Q${String(currentIndex + 1).padStart(2, '0')}` : '—';
  const currentTypeLabel = activeQuestion ? getQuestionTypeLabel(activeQuestion) : '';
  const currentText = activeQuestion?.prompt?.trim() || '질문 문장이 없습니다.';
  const activeResponseCount = answers.length;

  // 단일-오픈 모델: 지금 응답이 열린 질문은 세션 전체에서 최대 1개다.
  const openQuestion =
    questions.find((question) => (question.open ?? false) && Boolean(session?.accepting)) ?? null;
  // 결과 공개·응답 상태는 '현재 열린 그 질문'에 대해서만 유효하다.
  const isActiveTheOpenOne = Boolean(
    activeQuestion && openQuestion && activeQuestion.id === openQuestion.id,
  );
  const isResponseOpen = isActiveTheOpenOne;
  const isResultVisible = isActiveTheOpenOne && Boolean(session?.showResults);
  const canPublishResult =
    isActiveTheOpenOne && activeQuestion
      ? getQuestionResultVisibility(activeQuestion) === 'public'
      : false;

  const getRowCount = (questionId: string) =>
    questionId === activeQuestion?.id ? activeResponseCount : questionCounts[questionId] ?? 0;

  const runAdminAction = async (action: () => Promise<void>, successMessage?: string) => {
    try {
      setBusy(true);
      await action();
      if (successMessage) pushToast(successMessage, 'success');
    } catch (nextError) {
      pushToast(nextError instanceof Error ? nextError.message : '운영 작업 실행에 실패했습니다.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    if (questionId === activeQuestion?.id) return;
    // 목록에서 질문을 고르는 건 '보기/조작 대상' 전환일 뿐, 열림/결과 공개 상태는 건드리지 않는다.
    void runAdminAction(() => updateSession(sessionId, { activeQuestionId: questionId }));
  };

  const handleToggleResponseCollection = () => {
    if (!activeQuestion) return;
    if (isResponseOpen) {
      void runAdminAction(
        () => closeQuestion(sessionId, activeQuestion.id),
        '현재 질문의 응답을 마감했습니다.',
      );
      return;
    }
    // 단일-오픈: 이 질문만 열고 나머지는 자동으로 닫는다. 결과 공개도 초기화된다.
    const allQuestionIds = questions.map((question) => question.id);
    void runAdminAction(
      () => openQuestionExclusively(sessionId, activeQuestion.id, allQuestionIds),
      '이 질문의 응답을 열었습니다. 다른 질문은 자동으로 닫혔습니다.',
    );
  };

  const handleToggleResultVisibility = () => {
    // 결과 공개/비공개는 '지금 열린 그 질문'에 대해서만 가능하다.
    if (!activeQuestion || !isActiveTheOpenOne || !canPublishResult) return;
    void runAdminAction(
      () => updateSession(sessionId, { showResults: !isResultVisible }),
      isResultVisible ? '결과를 비공개로 전환했습니다.' : '결과를 공개했습니다.',
    );
  };

  const handleCopyStudentLink = async () => {
    try {
      await navigator.clipboard.writeText(studentJoinUrl);
      pushToast('학생 입장 링크를 복사했습니다.', 'success');
    } catch {
      pushToast('링크 복사에 실패했습니다.', 'error');
    }
  };

  const handleOpenStudentPage = () => {
    window.open(studentJoinUrl, '_blank', 'noopener,noreferrer');
  };

  const handleResetCurrentQuestion = () => {
    if (!activeQuestion) return;
    setResetModalOpen(false);
    void runAdminAction(async () => {
      const count = await deleteAnswersForQuestion(sessionId, activeQuestion.id);
      pushToast(`현재 질문 응답 ${count}개를 삭제했습니다.`, 'success');
    });
  };

  const handleResetSession = () => {
    if (questions.length === 0) return;
    setResetModalOpen(false);
    void runAdminAction(async () => {
      const questionIds = questions.map((question) => question.id);
      const count = await deleteAnswersForSession(sessionId, questionIds);
      await updateSession(sessionId, {
        accepting: false,
        showResults: false,
        activeQuestionId: questions[0]?.id,
      });
      pushToast(`전체 응답 ${count}개를 삭제했습니다.`, 'success');
    });
  };

  return (
    <main className="adminLivePage">
      <div className="adminLiveShell">
        <header className="adminLiveToolbar">
          <div className="adminLiveTitleBlock">
            <h1>실시간 운영</h1>
            <p>질문을 열고 닫고, 학생 응답과 결과 공개를 관리합니다.</p>
          </div>
        </header>

        {error ? <div className="inline-message inline-message--error adminLiveError">{error}</div> : null}
        {answersError ? (
          <div className="inline-message inline-message--error adminLiveError">{answersError}</div>
        ) : null}

        <section className="adminLiveWorkspace">
          <aside className="adminQuestionPanel">
            <header className="panelHeader">
              <h2>질문 목록</h2>
              <span>{questions.length}</span>
            </header>

            <div className="questionListScroll">
              {questions.length === 0 ? (
                <div className="questionListEmpty">등록된 질문이 없습니다.</div>
              ) : (
                questions.map((question, index) => {
                  const isSelected = question.id === activeQuestion?.id;
                  const isOpenRow = question.id === openQuestion?.id;
                  const typeLabel = getQuestionTypeLabel(question);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={`adminQuestionRow ${isSelected ? 'isSelected' : ''} ${isOpenRow ? 'isOpen' : ''}`}
                      disabled={busy}
                      onClick={() => handleSelectQuestion(question.id)}
                    >
                      <span className="questionIndexBadge">Q{String(index + 1).padStart(2, '0')}</span>
                      <span className="questionRowContent">
                        <strong>{question.title || typeLabel}</strong>
                        <span>
                          {typeLabel} · 응답 {getRowCount(question.id)}개
                        </span>
                      </span>
                      {isOpenRow ? (
                        <span className="questionOpenBadge">
                          <span className="questionOpenDot" aria-hidden="true" />
                          열림
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="adminMainColumn">
            <section className="liveResponsesCard">
              <header className="liveResponsesHeader">
                <div>
                  <h2>실시간 응답</h2>
                  <p>
                    현재 질문 기준 · <span className="highlight">{currentQuestionNumber}</span>
                    {currentTypeLabel ? (
                      <>
                        {' · '}
                        {currentTypeLabel}
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="responseCountBadge">응답 {activeResponseCount}개</span>
              </header>

              <div className="liveResponsesTableWrap">
                {activeQuestion && answers.length > 0 ? (
                  <table className="liveResponsesTable">
                    <thead>
                      <tr>
                        <th>닉네임</th>
                        <th>답변</th>
                        <th>시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {answers.map((answer) => (
                        <tr key={answer.uid}>
                          <td>
                            <span className="cellText">{answer.nickname || '익명'}</span>
                          </td>
                          <td>
                            <span className="cellText">
                              {getAnswerSummary(activeQuestion, answer) || '-'}
                            </span>
                          </td>
                          <td>
                            <span className="cellText">
                              {formatTimestamp(answer.updatedAt ?? answer.createdAt)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="emptyResponses">
                    <strong>아직 들어온 응답이 없습니다.</strong>
                    <p>학생이 응답하면 이곳에 실시간으로 표시됩니다.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="compactQuestionControlCard">
              <div className="compactQuestionInfo">
                <p className="sectionEyebrow">현재 질문 운영</p>
                <strong>
                  {currentQuestionNumber}
                  {currentTypeLabel ? ` · ${currentTypeLabel}` : ''}
                </strong>
                <span>{currentText}</span>
              </div>

              <div className="compactStateColumn">
                <div className="compactStateItem">
                  <span>응답 상태</span>
                  <strong className={isResponseOpen ? 'stateGreen' : 'stateGray'}>
                    {isResponseOpen ? '응답 열림' : '응답 마감'}
                  </strong>
                </div>
                <div className="compactStateItem">
                  <span>결과 상태</span>
                  <strong className={isResultVisible ? 'stateBlue' : 'stateGray'}>
                    {isResultVisible ? '결과 공개' : '결과 비공개'}
                  </strong>
                </div>
              </div>

              <div className="compactActionColumn">
                <button
                  type="button"
                  className={`primaryOperationButton ${isResponseOpen ? 'isClose' : ''}`}
                  disabled={busy || !activeQuestion}
                  onClick={handleToggleResponseCollection}
                >
                  {isResponseOpen ? '응답 마감하기' : '응답 열기'}
                </button>
                <button
                  type="button"
                  className="secondaryOperationButton"
                  disabled={busy || !activeQuestion || !canPublishResult}
                  title={
                    !activeQuestion
                      ? undefined
                      : !isActiveTheOpenOne
                        ? '응답을 먼저 열어야 결과를 공개할 수 있습니다.'
                        : !canPublishResult
                          ? '이 질문은 결과를 공개할 수 없는 설정입니다.'
                          : undefined
                  }
                  onClick={handleToggleResultVisibility}
                >
                  {isResultVisible ? '결과 비공개로 전환' : '결과 공개하기'}
                </button>
              </div>
            </section>
          </section>

          <aside className="adminRightRail">
            <section className="studentEntryCard">
              <h2>학생 입장</h2>

              <div className="studentQrBox" aria-label="학생 입장 QR 코드">
                <QRCodeSVG bgColor="#f8fafc" fgColor="#161513" includeMargin size={152} value={studentJoinUrl} />
              </div>

              <div className="studentLinkField">
                <label htmlFor="studentJoinUrl">학생 입장 링크</label>
                <textarea
                  id="studentJoinUrl"
                  className="studentJoinUrlTextarea"
                  value={studentJoinUrl}
                  readOnly
                  rows={2}
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>

              <div className="studentLinkActions">
                <button type="button" onClick={() => void handleCopyStudentLink()}>
                  <Copy />
                  링크 복사
                </button>
                <button type="button" onClick={handleOpenStudentPage}>
                  <ExternalLink />
                  학생 화면 열기
                </button>
              </div>
            </section>

            {canManageAnswerDocs ? (
              <section className="dangerCompactCard">
                <h2>위험 작업</h2>
                <p>테스트 응답을 삭제하고 다시 시작할 수 있습니다.</p>
                <button type="button" disabled={busy} onClick={() => setResetModalOpen(true)}>
                  <Trash2 />
                  응답 초기화
                </button>
              </section>
            ) : null}
          </aside>
        </section>
      </div>

      {resetModalOpen ? (
        <div
          className="resetModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="응답 초기화"
          onClick={() => setResetModalOpen(false)}
        >
          <div className="resetModal" onClick={(event) => event.stopPropagation()}>
            <h2>응답 초기화</h2>
            <p>테스트 응답을 삭제하고 다시 시작할 수 있습니다. 삭제 후에는 되돌릴 수 없습니다.</p>
            <div className="resetModalActions">
              <button
                type="button"
                className="resetDangerButton"
                disabled={busy || !activeQuestion}
                onClick={handleResetCurrentQuestion}
              >
                현재 질문 응답 초기화
              </button>
              <button
                type="button"
                className="resetDangerButton"
                disabled={busy || questions.length === 0}
                onClick={handleResetSession}
              >
                전체 응답 초기화
              </button>
              <button type="button" className="resetCancelButton" onClick={() => setResetModalOpen(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ToastStack toasts={toasts} />
    </main>
  );
}
