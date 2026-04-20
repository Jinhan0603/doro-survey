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
import { signInAdminWithEmail, signOutUser } from '../firebase/auth';
import { updateAnswerModeration } from '../firebase/answers';
import { appName, firebaseConfigStatus } from '../firebase/client';
import { seedSession, setActiveQuestionId, updateSession } from '../firebase/sessions';
import { type QuestionDoc } from '../firebase/types';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useSessionId } from '../hooks/useSessionId';
import {
  previewAnswerRows,
  previewQuestions,
} from '../data/previewQuestions';
import { seedQuestions } from '../data/seedQuestions';
import { downloadCsv } from '../utils/csv';
import { buildAppUrl } from '../utils/urls';
import { formatTimestamp, getAnswerSummary } from '../utils/stats';

function AdminPreview() {
  const [activeQuestionId, setActiveQuestionId] = useState(previewQuestions[1].id);
  const [accepting, setAccepting] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const activeQuestion = previewQuestions.find((question) => question.id === activeQuestionId) ?? previewQuestions[0];
  const studentUrl = useMemo(() => buildAppUrl('/student', 'robot-startup-2026'), []);

  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Badge tone="success">preview mode</Badge>
          <Badge>no firebase config</Badge>
        </div>
      }
      description="Firebase가 비어 있어서 현재는 운영 화면 preview만 표시합니다."
      eyebrow="Admin Preview"
      status="mock session / no backend"
      title="강의 흐름을 흔들지 않는 운영 화면"
    >
      <div className="page-grid page-grid--admin">
        <QuestionList
          activeQuestionId={activeQuestionId}
          questions={previewQuestions}
          onSelect={setActiveQuestionId}
        />

        <div className="stack">
          <AdminControls
            accepting={accepting}
            showResults={showResults}
            onToggleAccepting={() => setAccepting((value) => !value)}
            onToggleResults={() => setShowResults((value) => !value)}
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
              <span>현재 응답 수</span>
              <strong>20</strong>
            </div>
            <div className="metric-panel__row">
              <span>수집 상태</span>
              <strong>{accepting ? 'Open' : 'Closed'}</strong>
            </div>
            <div className="metric-panel__row">
              <span>결과 공개</span>
              <strong>{showResults ? 'Visible' : 'Hidden'}</strong>
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
  const { session, questions, activeQuestion, loading, error } = useActiveQuestion(sessionId);
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
  const buildStatusLabel = (value: boolean, onLabel: string, offLabel: string) =>
    value ? onLabel : offLabel;

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
    try {
      setBusy(true);
      setActionError(null);
      await seedSession(sessionId);
      setActionMessage('세션과 기본 질문 12개를 Firestore에 업로드했습니다.');
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : '세션 초기화에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleExportCsv = (question: QuestionDoc) => {
    downloadCsv(
        `${sessionId}-${question.id}-answers.csv`,
        ['uid', 'nickname', 'type', 'answer', 'approved', 'hidden'],
        answers.map((answer) => [
          answer.uid,
          answer.nickname,
          question.type,
          getAnswerSummary(question, answer),
          answer.approved,
          answer.hidden,
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
                size="sm"
                variant={answer.approved ? 'secondary' : 'primary'}
                onClick={() => {
                  void (async () => {
                    try {
                      setBusy(true);
                      setActionError(null);
                      await updateAnswerModeration({
                        sessionId,
                        questionId: activeQuestion.id,
                        uid: answer.uid,
                        approved: !answer.approved,
                      });
                    } catch (nextError) {
                      setActionError(
                        nextError instanceof Error ? nextError.message : '답변 승인 상태 변경에 실패했습니다.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                {answer.approved ? '승인 해제' : '승인'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void (async () => {
                    try {
                      setBusy(true);
                      setActionError(null);
                      await updateAnswerModeration({
                        sessionId,
                        questionId: activeQuestion.id,
                        uid: answer.uid,
                        hidden: !answer.hidden,
                      });
                    } catch (nextError) {
                      setActionError(
                        nextError instanceof Error ? nextError.message : '답변 숨김 상태 변경에 실패했습니다.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  })();
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
      <AppShell
        description="관리자 인증 상태를 확인하고 있습니다."
        eyebrow="Admin Live"
        status="checking auth"
        title="운영 화면 연결 중"
      >
        <WaitingCard title="인증 상태를 확인 중입니다." />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell
        description="Admin은 Firebase Email/Password 계정으로만 진입할 수 있습니다."
        eyebrow="Admin Live"
        status="sign-in required"
        title={`${appName} 운영 로그인`}
      >
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
              {authError ? <div className="inline-message inline-message--error">{authError}</div> : null}
              <Button disabled={!email.trim() || !password || busy} onClick={handleLogin} size="lg">
                {busy ? '로그인 중...' : '로그인'}
              </Button>
            </div>
          </Card>

          <Card className="banner-card">
            <h3>세션 준비 흐름</h3>
            <ol className="flow-list">
              <li>Admin 계정으로 로그인합니다.</li>
              <li>기본 질문 세트를 Firestore에 seed 합니다.</li>
              <li>현재 질문과 결과 공개 상태를 조작합니다.</li>
              <li>학생과 Display 화면은 같은 세션을 실시간으로 구독합니다.</li>
            </ol>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Badge tone="success">signed in</Badge>
          <Button size="sm" variant="secondary" onClick={handleSeed}>
            기본 질문 seed
          </Button>
          <Button size="sm" variant="ghost" onClick={() => signOutUser()}>
            로그아웃
          </Button>
        </div>
      }
      description="질문 전환, 응답 수집, 결과 공개, CSV 추출, 주관식 승인까지 라이브 운영 흐름을 한 화면에 모았습니다."
      eyebrow="Admin Live"
      status={user.email ?? 'authenticated admin'}
      title="실제 강의 운영용 Admin 화면"
    >
      <div className="page-grid page-grid--admin">
        <QuestionList
          activeQuestionId={session?.activeQuestionId ?? displayQuestions[0]?.id ?? ''}
          questions={displayQuestions}
          onSelect={(questionId) => {
            void setActiveQuestionId(sessionId, questionId);
          }}
        />

        <div className="stack">
          <AdminControls
            accepting={session?.accepting ?? false}
            showResults={session?.showResults ?? false}
            onToggleAccepting={() => {
              void updateSession(sessionId, { accepting: !(session?.accepting ?? false) });
            }}
            onToggleResults={() => {
              void updateSession(sessionId, { showResults: !(session?.showResults ?? false) });
            }}
          />

          <Card className="admin-current">
            <div className="section-heading">
              <h3>현재 진행 질문</h3>
              <Badge tone="accent">
                {activeQuestion ? `Q${String(activeQuestion.order).padStart(2, '0')}` : 'No active question'}
              </Badge>
            </div>
            {loading ? <p>질문을 불러오는 중입니다.</p> : null}
            {error ? <div className="inline-message inline-message--error">{error}</div> : null}
            {!activeQuestion && !loading ? <p>세션을 seed 한 뒤 질문을 열어주세요.</p> : null}
            {activeQuestion ? (
              <>
                <strong>{activeQuestion.title}</strong>
                <p>{activeQuestion.prompt}</p>
              </>
            ) : null}
            {actionMessage ? <div className="inline-message">{actionMessage}</div> : null}
            {actionError ? <div className="inline-message inline-message--error">{actionError}</div> : null}
            {activeQuestion ? (
              <div className="hero-actions">
                <Button size="sm" variant="secondary" onClick={() => handleExportCsv(activeQuestion)}>
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

function WaitingCard({ title }: { title: string }) {
  return <Card className="banner-card">{title}</Card>;
}
