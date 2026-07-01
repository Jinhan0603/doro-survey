import { useState } from 'react';
import { AdminControls } from '../components/admin/AdminControls';
import { AdminPreview } from '../components/admin/AdminPreview';
import { AnswerResetZone } from '../components/admin/AnswerResetZone';
import { AnswerTable } from '../components/admin/AnswerTable';
import { QrPanel } from '../components/admin/QrPanel';
import { QuestionList } from '../components/admin/QuestionList';
import { StatusInsightCard } from '../components/admin/StatusInsightCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ToastStack } from '../components/common/Toast';
import { AppShell } from '../components/layout/AppShell';
import { deleteAnswersForQuestion, deleteAnswersForSession, updateAnswerModeration } from '../firebase/answers';
import { firebaseConfigStatus } from '../firebase/client';
import { setActiveQuestionId, updateSession } from '../firebase/sessions';
import { type ResultVisibility } from '../firebase/types';
import { Link } from 'react-router-dom';
import { usePresenterAuth } from '../auth/AuthProvider';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSessionId } from '../hooks/useSessionId';
import { useToasts } from '../hooks/useToasts';
import { buildStatusResults, formatTimestamp, getAnswerSummary } from '../utils/stats';
import {
  getQuestionInputType,
  getQuestionResultVisibility,
  isModeratedQuestion,
} from '../utils/questionRuntime';
import { buildAppUrl } from '../utils/urls';

export function AdminPage() {
  const sessionId = useSessionId();
  // Auth is guaranteed by AuthGate (DoroGate SSO) before this page renders.
  const { user, role } = usePresenterAuth();
  const { profile } = useUserProfile(user?.uid);
  const firestoreEnabled = Boolean(user) && Boolean(sessionId);
  const { session, questions, activeQuestion, loading, error } = useActiveQuestion(sessionId ?? '', { enabled: firestoreEnabled });
  const { answers, error: answersError } = useAnswers(sessionId ?? '', activeQuestion?.id);
  const { toasts, pushToast, dismissToast } = useToasts();
  const [busy, setBusy] = useState(false);

  if (!firebaseConfigStatus.isConfigured) {
    return <AdminPreview />;
  }

  if (!sessionId) {
    return (
      <AppShell compact title="Admin 운영 화면">
        <Card className="banner-card">
          <p>운영할 설문을 먼저 선택하세요.</p>
          <Link to="/sessions">
            <Button size="sm">진행 중인 설문으로 이동</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  const studentUrl = buildAppUrl('/student', sessionId);
  // 실데이터(questions)만 표시한다. 로딩 중 mock 질문으로 채우면 실데이터 연동 시 값이 튀므로 폴백하지 않는다.
  const displayQuestions = questions;
  const approvedCount = answers.filter((a) => a.approved && !a.hidden).length;
  const hiddenCount = answers.filter((a) => a.hidden).length;
  const activeInputType = activeQuestion ? getQuestionInputType(activeQuestion) : null;
  const activeVisibility: ResultVisibility = activeQuestion
    ? getQuestionResultVisibility(activeQuestion)
    : 'public';
  const moderatedQuestion = activeQuestion ? isModeratedQuestion(activeQuestion) : false;
  const statusResults = activeQuestion && activeInputType === 'status'
    ? buildStatusResults(activeQuestion, answers)
    : [];
  const needHelpCount = statusResults.find((item) => item.name === 'need_help')?.value ?? 0;
  const completedCount =
    (statusResults.find((item) => item.name === 'done')?.value ?? 0) +
    (statusResults.find((item) => item.name === 'ready')?.value ?? 0);
  const controlNote = activeQuestion
    ? activeVisibility === 'teacher-only'
      ? '이 질문 결과는 Admin에서만 집계되며 Display에는 공개되지 않습니다.'
      : activeVisibility === 'hidden'
        ? '이 질문 결과는 Display에 표시되지 않습니다.'
        : '현재 질문의 응답 수집과 결과 공개 상태를 실시간으로 제어합니다.'
    : '현재 질문의 응답 수집과 결과 공개 상태를 실시간으로 제어합니다.';
  const canManageAnswerDocs = (role ?? profile?.role) === 'admin';

  const buildStatusLabel = (value: boolean, onLabel: string, offLabel: string) =>
    value ? onLabel : offLabel;

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

  const handleResetQuestion = async () => {
    if (!activeQuestion) return;
    const confirmed = window.confirm(
      `"${activeQuestion.title}" 질문의 응답을 모두 삭제합니다.\n\n삭제 후에는 되돌릴 수 없습니다. 계속하시겠습니까?`,
    );
    if (!confirmed) return;
    await runAdminAction(async () => {
      const count = await deleteAnswersForQuestion(sessionId, activeQuestion.id);
      pushToast(`현재 질문 응답 ${count}개를 삭제했습니다.`, 'success');
    });
  };

  const handleResetSession = async () => {
    if (displayQuestions.length === 0) return;
    const input = window.prompt(
      '전체 응답을 초기화합니다.\n\n삭제 후에는 되돌릴 수 없습니다.\n계속하려면 아래에 RESET을 정확히 입력하세요.',
    );
    if (input !== 'RESET') {
      if (input !== null) window.alert('RESET을 정확히 입력해야 삭제됩니다.');
      return;
    }
    await runAdminAction(async () => {
      const questionIds = displayQuestions.map((q) => q.id);
      const count = await deleteAnswersForSession(sessionId, questionIds);
      await updateSession(sessionId, {
        accepting: false,
        showResults: false,
        activeQuestionId: displayQuestions[0]?.id,
      });
      pushToast(`전체 응답 ${count}개를 삭제했습니다.`, 'success');
    });
  };

  const answerRows = activeQuestion
    ? answers.map((answer) => ({
        id: answer.uid,
        nickname: answer.nickname,
        answer: getAnswerSummary(activeQuestion, answer),
        statusLabel:
          moderatedQuestion
            ? answer.hidden
              ? '숨김'
              : answer.approved
                ? '승인됨'
                : '검토 필요'
            : activeVisibility === 'teacher-only'
              ? '강사용 집계'
              : activeVisibility === 'hidden'
                ? '비공개 집계'
                : '집계됨',
        submittedAt: formatTimestamp(answer.updatedAt ?? answer.createdAt),
        actions:
          moderatedQuestion && canManageAnswerDocs ? (
            <div className="inline-actions">
              <Button
                disabled={busy}
                size="sm"
                variant={answer.approved ? 'secondary' : 'primary'}
                onClick={() => {
                  void runAdminAction(
                    () =>
                      updateAnswerModeration({
                        sessionId,
                        questionId: activeQuestion.id,
                        uid: answer.uid,
                        approved: !answer.approved,
                      }),
                    `주관식 답변을 ${answer.approved ? '승인 해제' : '승인'}했습니다.`,
                  );
                }}
              >
                {answer.approved ? '승인 해제' : '승인'}
              </Button>
              <Button
                disabled={busy}
                size="sm"
                variant="ghost"
                onClick={() => {
                  void runAdminAction(
                    () =>
                      updateAnswerModeration({
                        sessionId,
                        questionId: activeQuestion.id,
                        uid: answer.uid,
                        hidden: !answer.hidden,
                      }),
                    `답변을 ${answer.hidden ? '다시 표시' : '숨김'} 처리했습니다.`,
                  );
                }}
              >
                {answer.hidden ? '표시' : '숨김'}
              </Button>
            </div>
          ) : undefined,
      }))
    : [];

  return (
    <AppShell
      compact
      title="Admin 운영 화면"
    >
      <div className="page-grid page-grid--admin">
        <QuestionList
          activeQuestionId={session?.activeQuestionId ?? displayQuestions[0]?.id ?? ''}
          questions={displayQuestions}
          onSelect={(questionId) => {
            void runAdminAction(
              () => setActiveQuestionId(sessionId, questionId),
              `현재 질문을 ${questionId}로 전환했습니다.`,
            );
          }}
        />

        <div className="stack">
          <Card className="status-strip">
            <div className="status-tile">
              <span>현재 응답 수</span>
              <strong>{answers.length}</strong>
            </div>
            <div className="status-tile">
              <span>{moderatedQuestion ? '승인된 답변' : '질문 타입'}</span>
              <strong>{moderatedQuestion ? approvedCount : activeInputType ?? '—'}</strong>
            </div>
            <div className="status-tile">
              <span>{moderatedQuestion ? '숨김 답변' : '표시 범위'}</span>
              <strong>{moderatedQuestion ? hiddenCount : activeVisibility}</strong>
            </div>
          </Card>

          <AdminControls
            accepting={session?.accepting ?? false}
            disabled={busy}
            note={controlNote}
            resultVisibility={activeVisibility}
            showResults={session?.showResults ?? false}
            onToggleAccepting={() => {
              void runAdminAction(
                () => updateSession(sessionId, { accepting: !(session?.accepting ?? false) }),
                `응답 수집을 ${(session?.accepting ?? false) ? '마감' : '오픈'}했습니다.`,
              );
            }}
            onToggleResults={() => {
              if (activeVisibility !== 'public') {
                return;
              }
              void runAdminAction(
                () => updateSession(sessionId, { showResults: !(session?.showResults ?? false) }),
                `결과 공개를 ${(session?.showResults ?? false) ? '비공개' : '공개'}로 변경했습니다.`,
              );
            }}
          />

          <Card className="admin-current">
            <div className="section-heading">
              <h3>현재 진행 질문</h3>
              <Badge tone="accent">
                {activeQuestion ? `Q${String(activeQuestion.order).padStart(2, '0')}` : '—'}
              </Badge>
            </div>
            {error ? <div className="inline-message inline-message--error">{error}</div> : null}
            {answersError ? <div className="inline-message inline-message--error">{answersError}</div> : null}
            {!activeQuestion && !loading ? <p>진행할 질문이 없습니다. 질문 목록에서 질문을 선택해주세요.</p> : null}
            {activeQuestion ? (
              <>
                <strong>{activeQuestion.title}</strong>
                <p>{activeQuestion.prompt}</p>
              </>
            ) : null}
          </Card>

          {activeQuestion && activeInputType === 'status' ? (
            <StatusInsightCard
              answersCount={answers.length}
              completedCount={completedCount}
              needHelpCount={needHelpCount}
              question={activeQuestion}
              statusResults={statusResults}
            />
          ) : null}

          {activeQuestion ? <AnswerTable rows={answerRows} title="실시간 응답" /> : null}

          {canManageAnswerDocs ? (
            <AnswerResetZone
              busy={busy}
              hasActiveQuestion={Boolean(activeQuestion)}
              hasQuestions={displayQuestions.length > 0}
              onResetQuestion={() => { void handleResetQuestion(); }}
              onResetSession={() => { void handleResetSession(); }}
            />
          ) : (
            <div className="inline-message">
              teacher role은 자기 세션 응답을 읽고 집계할 수 있지만, 응답 숨김/삭제 같은 전역 moderation 작업은 admin allowlist 계정에서만 수행합니다.
            </div>
          )}
        </div>

        <div className="stack">
          <QrPanel url={studentUrl} />
          <Card className="metric-panel">
            <div className="metric-panel__row">
              <span>현재 응답 수</span>
              <strong>{answers.length}</strong>
            </div>
            <div className="metric-panel__row">
              <span>수집 상태</span>
              <strong>{buildStatusLabel(session?.accepting ?? false, 'Open', 'Closed')}</strong>
            </div>
            <div className="metric-panel__row">
              <span>결과 공개</span>
              <strong>{buildStatusLabel(session?.showResults ?? false, 'Visible', 'Hidden')}</strong>
            </div>
          </Card>
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}
