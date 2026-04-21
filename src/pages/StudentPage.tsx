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
import { ChoiceQuestion } from '../components/survey/ChoiceQuestion';
import { QuestionCard } from '../components/survey/QuestionCard';
import { TextQuestion } from '../components/survey/TextQuestion';
import { WaitingState } from '../components/survey/WaitingState';
import { previewQuestions } from '../data/previewQuestions';

type PreviewMode = 'choice' | 'text' | 'waiting';
type SubmitState = 'idle' | 'submitting' | 'success';

const NICKNAME_STORAGE_KEY = 'doro-live-survey.nickname';

function getStoredNickname() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? '';
}

// Slim mobile header for student screens
function StudentShell({
  sessionId,
  isPreview = false,
  children,
}: {
  sessionId?: string;
  isPreview?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="student-shell">
      <header className="student-header">
        <div className="student-header__brand">
          <span className="brand-mark__tile">D</span>
          <span className="student-header__name">DORO Live Survey</span>
        </div>
        <div>
          {isPreview ? (
            <Badge>미리보기</Badge>
          ) : sessionId ? (
            <Badge tone="accent">{sessionId}</Badge>
          ) : null}
        </div>
      </header>
      <main className="student-main">{children}</main>
    </div>
  );
}

// First step: ask for nickname before showing any question
function NicknameOnboarding({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [value, setValue] = useState('');
  const isValid = normalizeNickname(value).length > 0;

  return (
    <div className="student-onboarding">
      <h1 className="student-onboarding__heading">
        수업에서 사용할<br />닉네임을 입력해주세요
      </h1>
      <p className="student-onboarding__hint">
        닉네임은 이 브라우저에 저장되며, 답변과 함께 표시됩니다.
      </p>
      <form
        className="student-onboarding__form"
        onSubmit={(e) => {
          e.preventDefault();
          const normalized = normalizeNickname(value);
          if (normalized) onConfirm(normalized);
        }}
      >
        <Input
          autoComplete="nickname"
          label="닉네임"
          name="nickname"
          placeholder="예: 민준"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="submit" fullWidth size="lg" disabled={!isValid}>
          입장하기
        </Button>
      </form>
    </div>
  );
}

// Shown after a successful submission
function SubmitSuccess({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="submit-success">
      <div className="submit-success__icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M7 18L15 26L29 10"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="submit-success__heading">답변이 제출되었습니다</h2>
      <p className="submit-success__desc">
        대표님이 결과를 공개하면<br />함께 확인할 수 있어요.
      </p>
      <button className="submit-success__edit" type="button" onClick={onEdit}>
        답변 수정하기
      </button>
    </div>
  );
}

function StudentPreview() {
  const [nickname, setNickname] = useState('');
  const [nicknameConfirmed, setNicknameConfirmed] = useState(false);
  const [choice, setChoice] = useState<string>();
  const [textAnswer, setTextAnswer] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<PreviewMode>('choice');

  const choiceQuestion = previewQuestions[1];
  const textQuestion = previewQuestions[2];

  // useMemo must be called before any conditional returns (Rules of Hooks)
  const questionContent = useMemo(() => {
    if (mode === 'waiting') {
      return (
        <WaitingState
          description="대표님이 다음 질문을 열면 자동으로 바뀝니다."
          title="다음 질문을 기다리는 중입니다"
        />
      );
    }

    if (mode === 'text') {
      return (
        <QuestionCard
          footer={
            <Button fullWidth size="lg" onClick={() => setShowSuccess(true)}>
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
            onChange={(value) => setTextAnswer(value)}
          />
        </QuestionCard>
      );
    }

    return (
      <QuestionCard
        footer={
          <Button fullWidth disabled={!choice} size="lg" onClick={() => setShowSuccess(true)}>
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
          onSelect={(value) => setChoice(value)}
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

  if (!nicknameConfirmed) {
    return (
      <StudentShell isPreview>
        <NicknameOnboarding
          onConfirm={(name) => {
            setNickname(name);
            setNicknameConfirmed(true);
          }}
        />
      </StudentShell>
    );
  }

  const previewBar = (
    <div className="student-preview-bar">
      <span className="student-preview-bar__label">미리보기 · {nickname}</span>
      <div className="student-preview-bar__modes">
        {(['choice', 'text', 'waiting'] as PreviewMode[]).map((m) => (
          <button
            key={m}
            className={`student-preview-bar__btn${mode === m ? ' is-active' : ''}`}
            type="button"
            onClick={() => { setMode(m); setShowSuccess(false); }}
          >
            {m === 'choice' ? '객관식' : m === 'text' ? '주관식' : '대기'}
          </button>
        ))}
      </div>
    </div>
  );

  if (showSuccess) {
    return (
      <StudentShell isPreview>
        {previewBar}
        <SubmitSuccess onEdit={() => setShowSuccess(false)} />
      </StudentShell>
    );
  }

  return (
    <StudentShell isPreview>
      {previewBar}
      {questionContent}
    </StudentShell>
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
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedChoice = choiceDraft ?? existingAnswer?.answer ?? '';
  const textValue = textDraft ?? existingAnswer?.answerText ?? '';

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
      setShowSuccess(true);
    } catch (nextError) {
      setSubmitState('idle');
      setSubmitError(nextError instanceof Error ? nextError.message : '답변 저장에 실패했습니다.');
    }
  };

  if (showSuccess) {
    return <SubmitSuccess onEdit={() => setShowSuccess(false)} />;
  }

  const isSubmitting = submitState === 'submitting';
  const hasAnswer = Boolean(existingAnswer);

  const footer = (
    <>
      {submitError ? (
        <div className="student-error">{submitError}</div>
      ) : null}
      <Button
        fullWidth
        disabled={
          isSubmitting || (question.type === 'choice' ? !selectedChoice : !textValue.trim())
        }
        size="lg"
        onClick={handleSubmit}
      >
        {isSubmitting ? '제출 중...' : hasAnswer ? '답변 다시 제출하기' : '이 답변 제출하기'}
      </Button>
      {hasAnswer && !submitError ? (
        <p className="student-already-submitted">이미 제출한 답변이 있습니다. 내용을 바꾸고 다시 누르면 갱신됩니다.</p>
      ) : null}
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
  const [nicknameConfirmed, setNicknameConfirmed] = useState(() => getStoredNickname().length > 0);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextValue = normalizeNickname(nickname);
    if (nextValue) {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, nextValue);
    } else {
      window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
    }
  }, [nickname]);

  useEffect(() => {
    if (!liveEnabled || authLoading || user) return;
    signInStudentAnonymously().catch((nextError) => {
      setAuthError(nextError instanceof Error ? nextError.message : '학생 로그인에 실패했습니다.');
    });
  }, [authLoading, liveEnabled, user]);

  if (!liveEnabled) {
    return <StudentPreview />;
  }

  const handleConfirmNickname = (name: string) => {
    setNickname(name);
    setNicknameConfirmed(true);
  };

  if (!nicknameConfirmed) {
    return (
      <StudentShell sessionId={sessionId}>
        <NicknameOnboarding onConfirm={handleConfirmNickname} />
      </StudentShell>
    );
  }

  const liveContent = (() => {
    if (authLoading || loading) {
      return (
        <WaitingState
          description="잠시만 기다려주세요."
          title="연결하는 중입니다"
        />
      );
    }

    if (authError || error) {
      return (
        <Card className="banner-card banner-card--error">{authError ?? error}</Card>
      );
    }

    if (!session || !activeQuestion) {
      return (
        <WaitingState
          description="대표님이 질문을 열면 자동으로 표시됩니다."
          title="질문을 기다리는 중입니다"
        />
      );
    }

    if (!session.accepting) {
      return (
        <WaitingState
          description="대표님이 다음 질문을 열면 자동으로 바뀝니다."
          title="답변이 마감되었습니다"
        />
      );
    }

    if (!user) {
      return (
        <WaitingState
          description="잠시만 기다려주세요."
          title="연결하는 중입니다"
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
    <StudentShell sessionId={sessionId}>
      {liveContent}
    </StudentShell>
  );
}
