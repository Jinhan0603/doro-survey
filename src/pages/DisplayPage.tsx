import { type ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { StatusSummary } from '../components/common/StatusSummary';
import { AppShell } from '../components/layout/AppShell';
import { AnswerWall } from '../components/display/AnswerWall';
import { DisplayStage } from '../components/display/DisplayStage';
import { ResultChart } from '../components/display/ResultChart';
import { firebaseConfigStatus } from '../firebase/client';
import { usePresenterAuth } from '../auth/AuthProvider';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
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
  // Auth is guaranteed by AuthGate (DoroGate SSO) before this page renders.
  const { user } = usePresenterAuth();
  const hasTeacherAuth = Boolean(user) && Boolean(sessionId);
  const { session, questions, loading, error } = useActiveQuestion(sessionId ?? '', {
    enabled: hasTeacherAuth,
  });
  // 단일-오픈 모델: 발표 화면은 지금 응답이 열린 그 질문을 따라간다.
  const openQuestion =
    questions.find((question) => (question.open ?? false) && Boolean(session?.accepting)) ?? null;
  const { answers, error: answersError } = useAnswers(
    sessionId ?? '',
    hasTeacherAuth ? openQuestion?.id : undefined,
  );

  if (!firebaseConfigStatus.isConfigured) {
    return <DisplayPreview />;
  }

  if (!sessionId) {
    return (
      <AppShell compact title="발표 화면">
        <Card className="banner-card">
          <p>발표할 설문을 먼저 선택하세요.</p>
          <Link to="/sessions">
            <Button size="sm">진행 중인 설문으로 이동</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  let content: ReactNode = null;

  if (loading) {
    content = null;
  } else if (error || answersError) {
    content = <Card className="banner-card banner-card--error">{error ?? answersError}</Card>;
  } else if (!session || !openQuestion) {
    content = (
      <Card className="banner-card">
        Admin에서 질문의 응답을 열면 이 화면에 자동으로 표시됩니다.
      </Card>
    );
  } else if (!isDisplayableQuestion(openQuestion)) {
    content = (
      <Card className="collecting-stage" tone="muted">
        <strong>발표 화면 비노출 질문</strong>
        <span>
          {getQuestionResultVisibility(openQuestion) === 'teacher-only'
            ? '이 질문 결과는 강사 화면에서만 집계됩니다.'
            : '이 질문 결과는 발표 화면에 표시되지 않습니다.'}
        </span>
      </Card>
    );
  } else if (!session.showResults) {
    content = (
      <Card className="collecting-stage" tone="muted">
        <h2>{openQuestion.title}</h2>
        <p>{openQuestion.prompt}</p>
        <strong>답변 수집 중</strong>
        <span>결과 공개를 누르면 그래프 또는 승인 답변이 나타납니다.</span>
      </Card>
    );
  } else if (getQuestionInputType(openQuestion) === 'text') {
    const approvedAnswers = getApprovedTextAnswers(answers);
    content = (
      <DisplayStage
        prompt={openQuestion.prompt}
        questionLabel={`Q${String(openQuestion.order).padStart(2, '0')}`}
        responseCount={approvedAnswers.length}
        title={openQuestion.title}
      >
        <AnswerWall answers={approvedAnswers} />
      </DisplayStage>
    );
  } else if (getQuestionInputType(openQuestion) === 'status') {
    content = (
      <DisplayStage
        prompt={openQuestion.prompt}
        questionLabel={`Q${String(openQuestion.order).padStart(2, '0')}`}
        responseCount={answers.length}
        title={openQuestion.title}
      >
        <StatusSummary
          items={buildStatusResults(openQuestion, answers).map((item) => ({
            label: item.name,
            value: item.value,
          }))}
        />
      </DisplayStage>
    );
  } else {
    content = (
      <DisplayStage
        prompt={openQuestion.prompt}
        questionLabel={`Q${String(openQuestion.order).padStart(2, '0')}`}
        responseCount={answers.length}
        title={openQuestion.title}
      >
        <ResultChart data={buildChoiceResults(openQuestion, answers)} />
      </DisplayStage>
    );
  }

  return (
    <AppShell compact title="발표 화면">
      <div className="stack stack--wide">{content}</div>
    </AppShell>
  );
}
