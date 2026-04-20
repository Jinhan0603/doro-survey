import { type ReactNode, useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { AppShell } from '../components/layout/AppShell';
import { AnswerWall } from '../components/display/AnswerWall';
import { DisplayStage } from '../components/display/DisplayStage';
import { ResultChart } from '../components/display/ResultChart';
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
import { buildChoiceResults, getApprovedTextAnswers } from '../utils/stats';
import { Badge } from '../components/common/Badge';

function DisplayPreview() {
  const [mode, setMode] = useState<'choice' | 'text' | 'collecting'>('choice');
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
  }, [choiceQuestion.order, choiceQuestion.prompt, choiceQuestion.title, mode, textQuestion.order, textQuestion.prompt, textQuestion.title]);

  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Button size="sm" variant={mode === 'choice' ? 'primary' : 'secondary'} onClick={() => setMode('choice')}>
            객관식 결과
          </Button>
          <Button size="sm" variant={mode === 'text' ? 'primary' : 'secondary'} onClick={() => setMode('text')}>
            승인 답변
          </Button>
          <Button
            size="sm"
            variant={mode === 'collecting' ? 'primary' : 'secondary'}
            onClick={() => setMode('collecting')}
          >
            수집 중
          </Button>
        </div>
      }
      description="Firebase 설정이 없어서 현재는 발표용 화면 preview를 보여줍니다."
      eyebrow="Display Preview"
      status="presentation-only stage"
      title="학생들과 함께 보는 결과 화면"
    >
      <div className="stack stack--wide">{stage}</div>
    </AppShell>
  );
}

export function DisplayPage() {
  const sessionId = useSessionId();
  const { user, loading: authLoading } = useAuth();
  const { session, activeQuestion, loading, error } = useActiveQuestion(sessionId);
  const { answers } = useAnswers(sessionId, activeQuestion?.id);

  if (!firebaseConfigStatus.isConfigured) {
    return <DisplayPreview />;
  }

  if (authLoading) {
    return (
      <AppShell
        description="Display 접근 권한을 확인하고 있습니다."
        eyebrow="Display Live"
        status="checking auth"
        title="발표 화면 연결 중"
      >
        <Card className="banner-card">관리자 인증 상태를 확인하고 있습니다.</Card>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell
        description="v1에서는 같은 브라우저에서 Admin 로그인된 상태일 때만 Display를 엽니다."
        eyebrow="Display Live"
        status="admin auth required"
        title="Display는 관리자 인증이 필요합니다"
      >
        <Card className="banner-card banner-card--error">
          먼저 Admin 화면에서 로그인한 뒤 이 Display 화면을 다시 열어주세요.
        </Card>
      </AppShell>
    );
  }

  let content: ReactNode = null;

  if (loading) {
    content = <Card className="banner-card">현재 질문과 답변을 불러오는 중입니다.</Card>;
  } else if (error) {
    content = <Card className="banner-card banner-card--error">{error}</Card>;
  } else if (!session || !activeQuestion) {
    content = (
      <Card className="banner-card">
        Admin에서 세션을 seed 하고 현재 질문을 열면 이 화면이 자동으로 연결됩니다.
      </Card>
    );
  } else if (!session.showResults) {
    content = (
      <Card className="collecting-stage" tone="muted">
        <h2>{activeQuestion.title}</h2>
        <p>{activeQuestion.prompt}</p>
        <strong>답변 수집 중</strong>
        <span>강사가 결과 공개를 눌러야 그래프 또는 승인 답변이 나타납니다.</span>
      </Card>
    );
  } else if (activeQuestion.type === 'choice') {
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
  } else {
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
  }

  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Badge tone="success">live display</Badge>
          <Badge>{sessionId}</Badge>
        </div>
      }
      description="Display는 Admin이 공개한 현재 질문 결과만 보여주는 발표 전용 화면입니다."
      eyebrow="Display Live"
      status={user.email ?? 'authenticated'}
      title="프로젝터용 실시간 결과 화면"
    >
      <div className="stack stack--wide">{content}</div>
    </AppShell>
  );
}
