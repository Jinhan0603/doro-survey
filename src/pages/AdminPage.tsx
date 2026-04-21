import { useMemo, useState } from 'react';
import { AdminControls } from '../components/admin/AdminControls';
import { AnswerTable } from '../components/admin/AnswerTable';
import { QrPanel } from '../components/admin/QrPanel';
import { QuestionList } from '../components/admin/QuestionList';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { AppShell } from '../components/layout/AppShell';
import { WaitingState } from '../components/survey/WaitingState';
import { signInAdminWithEmail, signOutUser } from '../firebase/auth';
import { updateAnswerModeration } from '../firebase/answers';
import { appName, firebaseConfigStatus } from '../firebase/client';
import { seedSession, setActiveQuestionId, updateSession } from '../firebase/sessions';
import { type QuestionDoc } from '../firebase/types';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useSessionId } from '../hooks/useSessionId';
import { previewAnswerRows, previewQuestions } from '../data/previewQuestions';
import { seedQuestions } from '../data/seedQuestions';
import { downloadCsv } from '../utils/csv';
import { formatTimestamp, getAnswerSummary } from '../utils/stats';
import { buildAppUrl } from '../utils/urls';

function AdminPreview() {
  const [activeQuestionId, setLocalActiveQuestion] = useState(previewQuestions[1].id);
  const [accepting, setAccepting] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const activeQuestion = previewQuestions.find((q) => q.id === activeQuestionId) ?? previewQuestions[0];
  const studentUrl = useMemo(() => buildAppUrl('/student', 'robot-startup-2026'), []);

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
  // Wait for auth before subscribing — Firestore rules require isSignedIn()
  const firestoreEnabled = !authLoading && !!user;
  const { session, questions, activeQuestion, loading, error } = useActiveQuestion(sessionId, { enabled: firestoreEnabled });
  const { answers } = useAnswers(sessionId, activeQuestion?.id);
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
      setAuthError(nextError instanceof Error ? nextError.message : '관리자 로그인에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleSeed = async () => {
    await runAdminAction(
      () => seedSession(sessionId),
      '세션과 기본 질문 12개를 Firestore에 업로드했습니다.',
    );
  };

  const handleExportCsv = (question: QuestionDoc) => {
    downloadCsv(
      `${sessionId}-${question.id}-answers.csv`,
      ['uid', 'nickname', 'type', 'answer', 'approved', 'hidden'],
      answers.map((a) => [
        a.uid,
        a.nickname,
        question.type,
        getAnswerSummary(question, a),
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
          activeQuestion.type === 'text'
            ? answer.hidden
              ? '숨김'
              : answer.approved
                ? '승인됨'
                : '검토 필요'
            : '집계됨',
        submittedAt: formatTimestamp(answer.updatedAt ?? answer.createdAt),
        actions:
          activeQuestion.type === 'text' ? (
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

  if (!user) {
    return (
      <AppShell compact title={`${appName} 관리자 로그인`}>
        <div className="auth-layout">
          <Card className="auth-card">
            <div className="section-heading">
              <h3>관리자 로그인</h3>
              <Badge tone="accent">{sessionId}</Badge>
            </div>
            <div className="stack">
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
              <span>승인된 답변</span>
              <strong>{approvedCount}</strong>
            </div>
            <div className="status-tile">
              <span>숨김 답변</span>
              <strong>{hiddenCount}</strong>
            </div>
          </Card>

          <AdminControls
            accepting={session?.accepting ?? false}
            disabled={busy}
            note="현재 질문의 응답 수집과 결과 공개 상태를 실시간으로 제어합니다."
            showResults={session?.showResults ?? false}
            onToggleAccepting={() => {
              void runAdminAction(
                () => updateSession(sessionId, { accepting: !(session?.accepting ?? false) }),
                `응답 수집을 ${(session?.accepting ?? false) ? '마감' : '오픈'}했습니다.`,
              );
            }}
            onToggleResults={() => {
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

          {activeQuestion ? <AnswerTable rows={answerRows} title="실시간 응답" /> : null}
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
