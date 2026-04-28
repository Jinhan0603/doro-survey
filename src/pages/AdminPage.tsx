import { useMemo, useState } from 'react';
import { AdminControls } from '../components/admin/AdminControls';
import { AnswerTable } from '../components/admin/AnswerTable';
import { QrPanel } from '../components/admin/QrPanel';
import { QuestionList } from '../components/admin/QuestionList';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { StatusSummary } from '../components/common/StatusSummary';
import { AppShell } from '../components/layout/AppShell';
import { WaitingState } from '../components/survey/WaitingState';
import { signInAdminWithEmail, signOutUser } from '../firebase/auth';
import { deleteAnswersForQuestion, deleteAnswersForSession, updateAnswerModeration } from '../firebase/answers';
import { appName, firebaseConfigStatus } from '../firebase/client';
import { seedSession, setActiveQuestionId, updateSession } from '../firebase/sessions';
import { inferRoleFromEmail } from '../firebase/users';
import { type QuestionDoc, type ResultVisibility } from '../firebase/types';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../hooks/useUserProfile';
import { useSessionId } from '../hooks/useSessionId';
import { previewAnswerRows, previewQuestions } from '../data/previewQuestions';
import { seedQuestions } from '../data/seedQuestions';
import { downloadCsv } from '../utils/csv';
import { buildStatusResults, formatTimestamp, getAnswerSummary } from '../utils/stats';
import {
  getDisplayAnswer,
  getQuestionInputType,
  getQuestionResultVisibility,
  isModeratedQuestion,
} from '../utils/questionRuntime';
import { buildAppUrl } from '../utils/urls';

function AdminPreview() {
  const [activeQuestionId, setLocalActiveQuestion] = useState(previewQuestions[1].id);
  const [accepting, setAccepting] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const activeQuestion = previewQuestions.find((q) => q.id === activeQuestionId) ?? previewQuestions[0];
  const studentUrl = useMemo(() => buildAppUrl('/student', 'doro-tech-class-2026'), []);

  return (
    <AppShell
      compact
      actions={
        <div className="hero-actions">
          <Badge>미리보기 모드</Badge>
        </div>
      }
      title="Admin 운영 화면"
    >
      <div className="page-grid page-grid--admin">
        <QuestionList
          activeQuestionId={activeQuestionId}
          questions={previewQuestions}
          onSelect={setLocalActiveQuestion}
        />

        <div className="stack">
          <Card className="status-strip">
            <div className="status-tile">
              <span>현재 응답 수</span>
              <strong>20</strong>
            </div>
            <div className="status-tile">
              <span>수집 상태</span>
              <strong>{accepting ? 'Open' : 'Closed'}</strong>
            </div>
            <div className="status-tile">
              <span>결과 공개</span>
              <strong>{showResults ? 'Visible' : 'Hidden'}</strong>
            </div>
          </Card>

          <AdminControls
            accepting={accepting}
            note="응답 수집 시작과 결과 공개 상태를 조작해보세요."
            showResults={showResults}
            onToggleAccepting={() => setAccepting((v) => !v)}
            onToggleResults={() => setShowResults((v) => !v)}
          />

          <Card className="admin-current">
            <div className="section-heading">
              <h3>현재 진행 질문</h3>
              <Badge tone="accent">Q{String(activeQuestion.order).padStart(2, '0')}</Badge>
            </div>
            <strong>{activeQuestion.title}</strong>
            <p>{activeQuestion.prompt}</p>
          </Card>

          <AnswerTable rows={previewAnswerRows} title="실시간 응답 미리보기" />
        </div>

        <div className="stack">
          <QrPanel url={studentUrl} />
          <Card className="metric-panel">
            <div className="metric-panel__row">
              <span>학생 접속 링크</span>
              <strong>QR ready</strong>
            </div>
            <div className="metric-panel__row">
              <span>현재 질문</span>
              <strong>{activeQuestion.id.toUpperCase()}</strong>
            </div>
            <div className="metric-panel__row">
              <span>모드</span>
              <strong>미리보기</strong>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export function AdminPage() {
  const sessionId = useSessionId();
  const { user, loading: authLoading } = useAuth();
  const hasTeacherAuth = Boolean(user?.email);
  const { profile } = useUserProfile(user?.uid);
  // Wait for auth before subscribing — Firestore rules require isSignedIn()
  const firestoreEnabled = !authLoading && hasTeacherAuth;
  const { session, questions, activeQuestion, loading, error } = useActiveQuestion(sessionId, { enabled: firestoreEnabled });
  const { answers, error: answersError } = useAnswers(sessionId, activeQuestion?.id);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!firebaseConfigStatus.isConfigured) {
    return <AdminPreview />;
  }

  const studentUrl = buildAppUrl('/student', sessionId);
  const displayQuestions = questions.length > 0 ? questions : seedQuestions;
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
  const canManageAnswerDocs = (profile?.role ?? inferRoleFromEmail(user?.email)) === 'admin';

  const buildStatusLabel = (value: boolean, onLabel: string, offLabel: string) =>
    value ? onLabel : offLabel;

  const runAdminAction = async (action: () => Promise<void>, successMessage?: string) => {
    try {
      setBusy(true);
      setActionError(null);
      if (successMessage) setActionMessage(null);
      await action();
      if (successMessage) setActionMessage(successMessage);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : '운영 작업 실행에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    try {
      setBusy(true);
      setAuthError(null);
      await signInAdminWithEmail(email, password);
    } catch (nextError) {
      setAuthError(nextError instanceof Error ? nextError.message : '강사 로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    await runAdminAction(
      () => seedSession(sessionId, undefined, undefined, {
        uid: user?.uid,
        organizationId: profile?.organizationId ?? 'dorossaem',
      }),
      '세션과 기본 질문 12개를 Firestore에 업로드했습니다.',
    );
  };

  const handleResetQuestion = async () => {
    if (!activeQuestion) return;
    const confirmed = window.confirm(
      `"${activeQuestion.title}" 질문의 응답을 모두 삭제합니다.\n\n수업 전에 CSV를 먼저 다운로드하는 것을 권장합니다.\n\n삭제 후에는 되돌릴 수 없습니다. 계속하시겠습니까?`,
    );
    if (!confirmed) return;
    await runAdminAction(async () => {
      const count = await deleteAnswersForQuestion(sessionId, activeQuestion.id);
      setActionMessage(`현재 질문 응답 ${count}개를 삭제했습니다.`);
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
      setActionMessage(`전체 응답 ${count}개를 삭제했습니다.`);
    });
  };

  const handleExportCsv = (question: QuestionDoc) => {
    downloadCsv(
      `${sessionId}-${question.id}-answers.csv`,
      ['uid', 'nickname', 'type', 'inputType', 'answer', 'displayAnswer', 'approved', 'hidden'],
      answers.map((a) => [
        a.uid,
        a.nickname,
        question.type,
        getQuestionInputType(question),
        a.answer ?? a.answerText ?? a.answerValue ?? a.answerValues?.join(' | ') ?? '',
        getDisplayAnswer(a),
        a.approved,
        a.hidden,
      ]),
    );
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

  if (authLoading) {
    return (
      <AppShell compact title="Admin 운영 화면">
        <WaitingState description="잠시만 기다려주세요." title="인증 상태를 확인하는 중입니다" />
      </AppShell>
    );
  }

  if (!hasTeacherAuth) {
    return (
      <AppShell compact title={`${appName} 강사 로그인`}>
        <div className="auth-layout">
          <Card className="auth-card">
            <div className="section-heading">
              <h3>강사 로그인</h3>
              <Badge tone="accent">{sessionId}</Badge>
            </div>
            <div className="stack">
              {user && !user.email ? (
                <div className="inline-message inline-message--error">
                  학생 익명 로그인 상태입니다. 강사 계정으로 다시 로그인해주세요.
                </div>
              ) : null}
              <Input
                autoComplete="email"
                label="이메일"
                name="admin-email"
                placeholder="admin@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Input
                autoComplete="current-password"
                label="비밀번호"
                name="admin-password"
                placeholder="비밀번호"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {authError ? (
                <div className="inline-message inline-message--error">{authError}</div>
              ) : null}
              <Button disabled={!email.trim() || !password || busy} size="lg" onClick={handleLogin}>
                {busy ? '로그인 중...' : '로그인'}
              </Button>
            </div>
          </Card>

          <Card className="banner-card">
            <h3>수업 당일 사용 순서</h3>
            <ol className="flow-list">
              <li>Admin 화면에서 로그인합니다.</li>
              <li>기본 질문 seed 버튼을 누릅니다.</li>
              <li>학생용 QR 또는 링크를 공유합니다.</li>
              <li>질문을 선택하고 응답 수집을 엽니다.</li>
              <li>응답이 모이면 마감 후 결과 공개를 누릅니다.</li>
              <li>Display 화면을 보며 함께 토론합니다.</li>
            </ol>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      compact
      actions={
        <div className="hero-actions">
          <Badge tone="success">로그인 완료</Badge>
          <Button disabled={busy} size="sm" variant="secondary" onClick={handleSeed}>
            {busy ? '작업 중...' : '기본 질문 seed'}
          </Button>
          <Button disabled={busy} size="sm" variant="ghost" onClick={() => signOutUser()}>
            로그아웃
          </Button>
        </div>
      }
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
            {loading ? <p>질문을 불러오는 중입니다.</p> : null}
            {error ? <div className="inline-message inline-message--error">{error}</div> : null}
            {answersError ? <div className="inline-message inline-message--error">{answersError}</div> : null}
            {!activeQuestion && !loading ? <p>기본 질문 seed 후 질문을 선택해주세요.</p> : null}
            {activeQuestion ? (
              <>
                <strong>{activeQuestion.title}</strong>
                <p>{activeQuestion.prompt}</p>
              </>
            ) : null}
            {actionMessage ? <div className="inline-message">{actionMessage}</div> : null}
            {actionError ? (
              <div className="inline-message inline-message--error">{actionError}</div>
            ) : null}
            {activeQuestion ? (
              <div className="hero-actions">
                <Button
                  disabled={busy}
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExportCsv(activeQuestion)}
                >
                  CSV 다운로드
                </Button>
              </div>
            ) : null}
          </Card>

          {activeQuestion && activeInputType === 'status' ? (
            <Card className="metric-panel">
              <div className="section-heading">
                <h3>
                  {activeQuestion.interactionType === 'readiness-check'
                    ? '실습 준비 상태'
                    : activeQuestion.interactionType === 'progress-check'
                      ? '실습 진행 상태'
                      : '상태 집계'}
                </h3>
                <Badge tone="accent">{answers.length} responses</Badge>
              </div>
              <StatusSummary items={statusResults.map((item) => ({ label: item.name, value: item.value }))} />
              <div className="inline-message">
                {activeQuestion.interactionType === 'readiness-check'
                  ? `ready/done ${completedCount}명, need_help ${needHelpCount}명으로 실습 시작 가능 상태를 빠르게 확인할 수 있습니다.`
                  : activeQuestion.interactionType === 'progress-check'
                    ? `done/ready ${completedCount}명, need_help ${needHelpCount}명으로 중간 점검 상태를 빠르게 해석할 수 있습니다.`
                    : `현재 상태 응답 ${answers.length}개를 Admin에서만 실시간 집계 중입니다.`}
              </div>
            </Card>
          ) : null}

          {activeQuestion ? <AnswerTable rows={answerRows} title="실시간 응답" /> : null}

          {canManageAnswerDocs ? (
            <div className="danger-zone">
              <div className="danger-zone__header">
                <h3 className="danger-zone__title">응답 초기화</h3>
                <p className="danger-zone__desc">
                  테스트 응답을 삭제하고 수업을 깨끗하게 시작할 수 있습니다.<br />
                  삭제 후에는 되돌릴 수 없습니다. 수업 전에 CSV를 먼저 다운로드하는 것을 권장합니다.
                </p>
              </div>
              <div className="danger-zone__buttons">
                <Button
                  className="button--danger"
                  disabled={busy || !activeQuestion}
                  size="sm"
                  variant="secondary"
                  onClick={() => { void handleResetQuestion(); }}
                >
                  현재 질문 응답 초기화
                </Button>
                <Button
                  className="button--danger button--danger-strong"
                  disabled={busy || displayQuestions.length === 0}
                  size="sm"
                  variant="secondary"
                  onClick={() => { void handleResetSession(); }}
                >
                  전체 응답 초기화
                </Button>
              </div>
            </div>
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
    </AppShell>
  );
}
