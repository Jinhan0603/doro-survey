import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { signInStudentAnonymously } from '../firebase/auth';
import { upsertAnswer } from '../firebase/answers';
import { type AnswerDoc, type QuestionDoc } from '../firebase/types';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useOwnAnswer } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useSessionId } from '../hooks/useSessionId';
import { normalizeNickname, normalizeTextAnswer } from '../utils/sanitize';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { AppShell } from '../components/layout/AppShell';
import { ChoiceQuestion } from '../components/survey/ChoiceQuestion';
import { QuestionCard } from '../components/survey/QuestionCard';
import { TextQuestion } from '../components/survey/TextQuestion';
import { WaitingState } from '../components/survey/WaitingState';
import { previewQuestions } from '../data/previewQuestions';

type PreviewMode = 'choice' | 'text' | 'waiting';
type SubmitState = 'idle' | 'submitting' | 'success';

const NICKNAME_STORAGE_KEY = 'doro-live-survey.nickname';

function getStoredNickname() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? '';
}

function StudentPreview() {
  const [nickname, setNickname] = useState('');
  const [choice, setChoice] = useState<string>();
  const [textAnswer, setTextAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<PreviewMode>('choice');

  const choiceQuestion = previewQuestions[1];
  const textQuestion = previewQuestions[2];

  const content = useMemo(() => {
    if (mode === 'waiting') {
      return (
        <WaitingState
          description="강사가 다음 질문을 여는 순간 이 화면이 자동으로 바뀌는 흐름을 여기에 연결할 예정입니다."
          title="다음 질문을 기다리는 중"
        />
      );
    }

    if (mode === 'text') {
      return (
        <QuestionCard
          footer={
            <Button fullWidth onClick={() => setSubmitted(true)} size="lg">
              답변 제출하기
            </Button>
          }
          prompt={textQuestion.prompt}
          stepLabel={`질문 ${String(textQuestion.order).padStart(2, '0')}`}
          title={textQuestion.title}
        >
          <TextQuestion
            maxLength={textQuestion.maxLength ?? 200}
            value={textAnswer}
            onChange={(value) => {
              setSubmitted(false);
              setTextAnswer(value);
            }}
          />
        </QuestionCard>
      );
    }

    return (
      <QuestionCard
        footer={
          <Button fullWidth disabled={!choice} onClick={() => setSubmitted(true)} size="lg">
            답변 제출하기
          </Button>
        }
        prompt={choiceQuestion.prompt}
        stepLabel={`질문 ${String(choiceQuestion.order).padStart(2, '0')}`}
        title={choiceQuestion.title}
      >
        <ChoiceQuestion
          choices={choiceQuestion.choices ?? []}
          selectedChoice={choice}
          onSelect={(value) => {
            setSubmitted(false);
            setChoice(value);
          }}
        />
      </QuestionCard>
    );
  }, [
    choice,
    choiceQuestion.choices,
    choiceQuestion.order,
    choiceQuestion.prompt,
    choiceQuestion.title,
    mode,
    textAnswer,
    textQuestion.maxLength,
    textQuestion.order,
    textQuestion.prompt,
    textQuestion.title,
  ]);

  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Button size="sm" variant={mode === 'choice' ? 'primary' : 'secondary'} onClick={() => setMode('choice')}>
            객관식 미리보기
          </Button>
          <Button size="sm" variant={mode === 'text' ? 'primary' : 'secondary'} onClick={() => setMode('text')}>
            주관식 미리보기
          </Button>
          <Button
            size="sm"
            variant={mode === 'waiting' ? 'primary' : 'secondary'}
            onClick={() => setMode('waiting')}
          >
            대기 상태
          </Button>
        </div>
      }
      description="Firebase 설정이 없어서 현재는 학생 화면 preview 모드로 동작합니다."
      eyebrow="Student Preview"
      status="mock mode / no firebase config"
      title="학생이 한 번에 이해하고 누를 수 있는 질문 화면"
    >
      <div className="page-grid page-grid--student">
        <Card className="identity-card" tone="muted">
          <Input
            autoComplete="nickname"
            hint="실서비스에서는 localStorage와 익명 로그인에 연결됩니다."
            label="닉네임"
            name="nickname"
            placeholder="예: 민준"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
          {submitted ? <Badge tone="success">답변이 제출되었습니다</Badge> : <Badge>제출 전</Badge>}
        </Card>
        {content}
      </div>
    </AppShell>
  );
}

function buildQuestionCard(question: QuestionDoc, children: ReactNode, footer: ReactNode) {
  return (
    <QuestionCard
      footer={footer}
      prompt={question.prompt}
      stepLabel={`질문 ${String(question.order).padStart(2, '0')}`}
      title={question.title}
    >
      {children}
    </QuestionCard>
  );
}

type LiveQuestionFormProps = {
  question: QuestionDoc;
  sessionId: string;
  nickname: string;
  existingAnswer: AnswerDoc | null;
  uid: string;
};

function LiveQuestionForm({
  question,
  sessionId,
  nickname,
  existingAnswer,
  uid,
}: LiveQuestionFormProps) {
  const [choiceDraft, setChoiceDraft] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedChoice = choiceDraft ?? existingAnswer?.answer ?? '';
  const textValue = textDraft ?? existingAnswer?.answerText ?? '';
  const hasSubmitted = submitState === 'success' || Boolean(existingAnswer);

  const handleSubmit = async () => {
    const normalizedNickname = normalizeNickname(nickname);
    if (!normalizedNickname) {
      setSubmitError('닉네임을 먼저 입력해주세요.');
      return;
    }

    const rawValue = question.type === 'choice' ? selectedChoice : textValue;
    const normalizedValue =
      question.type === 'choice'
        ? rawValue.trim()
        : normalizeTextAnswer(rawValue, question.maxLength || 300);

    if (!normalizedValue) {
      setSubmitError('답변을 입력하거나 선택해주세요.');
      return;
    }

    try {
      setSubmitState('submitting');
      setSubmitError(null);
      await upsertAnswer({
        sessionId,
        questionId: question.id,
        uid,
        nickname: normalizedNickname,
        questionType: question.type,
        value: normalizedValue,
      });
      setSubmitState('success');
    } catch (nextError) {
      setSubmitState('idle');
      setSubmitError(nextError instanceof Error ? nextError.message : '답변 저장에 실패했습니다.');
    }
  };

  const footer = (
    <>
      <Button
        fullWidth
        disabled={
          submitState === 'submitting' || (question.type === 'choice' ? !selectedChoice : !textValue.trim())
        }
        onClick={handleSubmit}
        size="lg"
      >
        {submitState === 'submitting' ? '제출 중...' : '답변 제출하기'}
      </Button>
      {submitError ? <div className="inline-message inline-message--error">{submitError}</div> : null}
      {hasSubmitted ? <div className="inline-message">답변이 저장되었습니다. 다시 제출하면 최신 답으로 갱신됩니다.</div> : null}
    </>
  );

  if (question.type === 'choice') {
    return buildQuestionCard(
      question,
      <ChoiceQuestion
        choices={question.choices}
        selectedChoice={selectedChoice}
        onSelect={(value) => {
          setSubmitError(null);
          setSubmitState('idle');
          setChoiceDraft(value);
        }}
      />,
      footer,
    );
  }

  return buildQuestionCard(
    question,
    <TextQuestion
      maxLength={question.maxLength || 300}
      value={textValue}
      onChange={(value) => {
        setSubmitError(null);
        setSubmitState('idle');
        setTextDraft(value);
      }}
    />,
    footer,
  );
}

export function StudentPage() {
  const sessionId = useSessionId();
  const liveEnabled = firebaseConfigStatus.isConfigured;
  const { user, loading: authLoading } = useAuth();
  const { session, activeQuestion, loading, error } = useActiveQuestion(sessionId);
  const { answer: existingAnswer } = useOwnAnswer(sessionId, activeQuestion?.id, user?.uid);
  const [nickname, setNickname] = useState(getStoredNickname);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextValue = normalizeNickname(nickname);
    if (nextValue) {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, nextValue);
      return;
    }

    window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
  }, [nickname]);

  useEffect(() => {
    if (!liveEnabled || authLoading || user) {
      return;
    }

    signInStudentAnonymously().catch((nextError) => {
      setAuthError(nextError instanceof Error ? nextError.message : '학생 로그인에 실패했습니다.');
    });
  }, [authLoading, liveEnabled, user]);

  if (!liveEnabled) {
    return <StudentPreview />;
  }

  const liveContent = (() => {
    if (authLoading || loading) {
      return (
        <WaitingState
          description="학생 인증과 현재 질문을 확인하고 있습니다."
          title="수업 세션에 연결 중"
        />
      );
    }

    if (authError || error) {
      return <Card className="banner-card banner-card--error">{authError ?? error}</Card>;
    }

    if (!session || !activeQuestion) {
      return (
        <WaitingState
          description="Admin이 아직 세션을 seed 하지 않았거나, 현재 질문이 열리지 않았습니다."
          title="질문 준비 중"
        />
      );
    }

    if (!session.accepting) {
      return (
        <WaitingState
          description="강사가 답변을 다시 열면 자동으로 제출이 가능해집니다."
          title="답변이 마감되었습니다"
        />
      );
    }

    if (!user) {
      return (
        <WaitingState
          description="익명 학생 계정을 연결하는 중입니다."
          title="학생 로그인 중"
        />
      );
    }

    return (
      <LiveQuestionForm
        key={activeQuestion.id}
        existingAnswer={existingAnswer}
        nickname={nickname}
        question={activeQuestion}
        sessionId={sessionId}
        uid={user.uid}
      />
    );
  })();

  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Badge tone="success">live session</Badge>
          <Badge>{sessionId}</Badge>
        </div>
      }
      description="학생은 QR 링크로 들어오면 익명 로그인된 상태에서 현재 질문 하나만 보고 바로 응답합니다."
      eyebrow="Student Live"
      status={user ? `anonymous / ${user.uid.slice(0, 8)}` : 'connecting auth'}
      title="실제 수업용 학생 응답 화면"
    >
      <div className="page-grid page-grid--student">
        <Card className="identity-card" tone="muted">
          <Input
            autoComplete="nickname"
            hint="닉네임은 이 브라우저에 저장됩니다."
            label="닉네임"
            name="nickname"
            placeholder="예: 민준"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
          {existingAnswer ? (
            <Badge tone="success">이 질문에 이미 응답했습니다</Badge>
          ) : (
            <Badge>{session?.accepting ? '응답 가능' : '응답 대기'}</Badge>
          )}
        </Card>
        {liveContent}
      </div>
    </AppShell>
  );
}
