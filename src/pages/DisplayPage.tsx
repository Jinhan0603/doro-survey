import { type ReactNode, useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { StatusSummary } from '../components/common/StatusSummary';
import { AppShell } from '../components/layout/AppShell';
import { AnswerWall } from '../components/display/AnswerWall';
import { DisplayStage } from '../components/display/DisplayStage';
import { ResultChart } from '../components/display/ResultChart';
import { WaitingState } from '../components/survey/WaitingState';
import { firebaseConfigStatus } from '../firebase/client';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useSessionId } from '../hooks/useSessionId';
import {
  previewChartData,
  previewQuestions,
  previewTextAnswers,
} from '../data/previewQuestions';
import { buildChoiceResults, buildStatusResults, getApprovedTextAnswers } from '../utils/stats';
import { getQuestionInputType, getQuestionResultVisibility, isDisplayableQuestion } from '../utils/questionRuntime';

type DisplayMode = 'choice' | 'text' | 'collecting';

function DisplayPreview() {
  const [mode, setMode] = useState<DisplayMode>('choice');
  const choiceQuestion = previewQuestions[1];
  const textQuestion = previewQuestions[2];

  const stage = useMemo(() => {
    if (mode === 'text') {
      return (
        <DisplayStage
          prompt={textQuestion.prompt}
          questionLabel={`Q${String(textQuestion.order).padStart(2, '0')}`}
          responseCount={previewTextAnswers.length}
          title={textQuestion.title}
        >
          <AnswerWall answers={previewTextAnswers} />
        </DisplayStage>
      );
    }

    if (mode === 'collecting') {
      return (
        <Card className="collecting-stage" tone="muted">
          <h2>{choiceQuestion.title}</h2>
          <p>{choiceQuestion.prompt}</p>
          <strong>답변 수집 중</strong>
          <span>학생들이 답을 고르는 동안 결과는 숨겨집니다.</span>
        </Card>
      );
    }

    return (
      <DisplayStage
        prompt={choiceQuestion.prompt}
        questionLabel={`Q${String(choiceQuestion.order).padStart(2, '0')}`}
        responseCount={20}
        title={choiceQuestion.title}
      >
        <ResultChart data={previewChartData} />
      </DisplayStage>
    );
  }, [
    choiceQuestion.order,
    choiceQuestion.prompt,
    choiceQuestion.title,
    mode,
    textQuestion.order,
    textQuestion.prompt,
    textQuestion.title,
  ]);

  const modeLabels: Record<DisplayMode, string> = {
    choice: '객관식 결과',
    text: '주관식 답변',
    collecting: '수집 중',
  };

  return (
    <AppShell
      compact
      actions={
        <div className="hero-actions">
          <Badge>미리보기 모드</Badge>
          {(['choice', 'text', 'collecting'] as DisplayMode[]).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? 'primary' : 'secondary'}
              onClick={() => setMode(m)}
            >
              {modeLabels[m]}
            </Button>
          ))}
        </div>
      }
      title="발표 화면"
    >
      <div className="stack stack--wide">{stage}</div>
    </AppShell>
  );
}

export function DisplayPage() {
  const sessionId = useSessionId();
  const { user, loading: authLoading } = useAuth();
  const hasTeacherAuth = Boolean(user?.email);
  const { session, activeQuestion, loading, error } = useActiveQuestion(sessionId, {
    enabled: !authLoading && hasTeacherAuth,
  });
  const { answers, error: answersError } = useAnswers(sessionId, hasTeacherAuth ? activeQuestion?.id : undefined);

  if (!firebaseConfigStatus.isConfigured) {
    return <DisplayPreview />;
  }

  if (authLoading) {
    return (
      <AppShell compact title="발표 화면">
        <WaitingState description="잠시만 기다려주세요." title="접근 권한을 확인하는 중입니다" />
      </AppShell>
    );
  }

  if (!hasTeacherAuth) {
    return (
      <AppShell compact title="발표 화면">
        <Card className="banner-card banner-card--error">
          {user && !user.email
            ? '학생 익명 로그인 상태입니다. 먼저 Admin 화면에서 강사 계정으로 로그인한 뒤 이 화면을 다시 열어주세요.'
            : '먼저 Admin 화면에서 로그인한 뒤 이 화면을 다시 열어주세요.'}
        </Card>
      </AppShell>
    );
  }

  let content: ReactNode = null;

  if (loading) {
    content = (
      <WaitingState description="잠시만 기다려주세요." title="질문과 답변을 불러오는 중입니다" />
    );
  } else if (error || answersError) {
    content = <Card className="banner-card banner-card--error">{error ?? answersError}</Card>;
  } else if (!session || !activeQuestion) {
    content = (
      <Card className="banner-card">
        Admin에서 세션을 seed 하고 현재 질문을 열면 이 화면이 자동으로 연결됩니다.
      </Card>
    );
  } else if (!isDisplayableQuestion(activeQuestion)) {
    content = (
      <Card className="collecting-stage" tone="muted">
        <strong>발표 화면 비노출 질문</strong>
        <span>
          {getQuestionResultVisibility(activeQuestion) === 'teacher-only'
            ? '이 질문 결과는 강사 화면에서만 집계됩니다.'
            : '이 질문 결과는 발표 화면에 표시되지 않습니다.'}
        </span>
      </Card>
    );
  } else if (!session.showResults) {
    content = (
      <Card className="collecting-stage" tone="muted">
        <h2>{activeQuestion.title}</h2>
        <p>{activeQuestion.prompt}</p>
        <strong>답변 수집 중</strong>
        <span>결과 공개를 누르면 그래프 또는 승인 답변이 나타납니다.</span>
      </Card>
    );
  } else if (getQuestionInputType(activeQuestion) === 'text') {
    const approvedAnswers = getApprovedTextAnswers(answers);
    content = (
      <DisplayStage
        prompt={activeQuestion.prompt}
        questionLabel={`Q${String(activeQuestion.order).padStart(2, '0')}`}
        responseCount={approvedAnswers.length}
        title={activeQuestion.title}
      >
        <AnswerWall answers={approvedAnswers} />
      </DisplayStage>
    );
  } else if (getQuestionInputType(activeQuestion) === 'status') {
    content = (
      <DisplayStage
        prompt={activeQuestion.prompt}
        questionLabel={`Q${String(activeQuestion.order).padStart(2, '0')}`}
        responseCount={answers.length}
        title={activeQuestion.title}
      >
        <StatusSummary
          items={buildStatusResults(activeQuestion, answers).map((item) => ({
            label: item.name,
            value: item.value,
          }))}
        />
      </DisplayStage>
    );
  } else {
    content = (
      <DisplayStage
        prompt={activeQuestion.prompt}
        questionLabel={`Q${String(activeQuestion.order).padStart(2, '0')}`}
        responseCount={answers.length}
        title={activeQuestion.title}
      >
        <ResultChart data={buildChoiceResults(activeQuestion, answers)} />
      </DisplayStage>
    );
  }

  return (
    <AppShell
      compact
      actions={
        <div className="hero-actions">
          <Badge tone="success">실시간 연결</Badge>
          <Badge>{sessionId}</Badge>
          {session ? (
            <Badge tone={session.showResults ? 'accent' : 'default'}>
              {session.showResults ? '결과 공개 중' : '결과 비공개'}
            </Badge>
          ) : null}
        </div>
      }
      title="발표 화면"
    >
      <div className="stack stack--wide">{content}</div>
    </AppShell>
  );
}
