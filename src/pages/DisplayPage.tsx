import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Users } from 'lucide-react';
import { BackLink } from '../components/common/BackLink';
import type { QuestionDoc, ResultVisibility } from '../firebase/types';
import { firebaseConfigStatus } from '../firebase/client';
import { usePresenterAuth } from '../auth/AuthProvider';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useAnswers } from '../hooks/useAnswers';
import { useSessionId } from '../hooks/useSessionId';
import { buildChoiceResults, getApprovedTextAnswers } from '../utils/stats';
import {
  getQuestionChoices,
  getQuestionInputType,
  getQuestionResultVisibility,
  getQuestionTypeLabel,
  isDisplayableQuestion,
} from '../utils/questionRuntime';
import { previewQuestions } from '../data/previewQuestions';
import '../styles/display-stage.css';

type ChoiceResult = { name: string; value: number };
type TextAnswer = ReturnType<typeof getApprovedTextAnswers>[number];

// 발표 화면은 읽기 전용이다. 강사 조작 버튼·QR·링크·코드·원시 enum 값을 절대 노출하지 않는다.

function DisplayQuestionHeader({
  questionNumber,
  typeLabel,
  responseCount,
  resultVisible,
}: {
  questionNumber: string;
  typeLabel: string;
  responseCount: number;
  resultVisible: boolean;
}) {
  return (
    <header className="displayQuestionHeader">
      <div className="displayQuestionMeta">
        <span className="questionNumberBadge">{questionNumber}</span>
        <span className="questionTypeBadge">{typeLabel}</span>
        <span className={`resultStateBadge ${resultVisible ? 'isVisible' : 'isHidden'}`}>
          {resultVisible ? '결과 공개' : '결과 비공개'}
        </span>
      </div>
      <div className="responseSummaryBadge">
        <Users className="displayBadgeIcon" aria-hidden="true" />
        <span>총 응답</span>
        <strong>{responseCount}개</strong>
      </div>
    </header>
  );
}

function ChoicePreview({ choices }: { choices: string[] }) {
  return (
    <>
      <div className="choicePreviewGrid">
        {choices.map((choice, index) => (
          <div className="choicePreviewCard" key={`${choice}-${index}`}>
            <span>{index + 1}</span>
            <strong>{choice}</strong>
          </div>
        ))}
      </div>
      <p className="displayMutedNotice">
        <Lock className="displayBadgeIcon" aria-hidden="true" />
        결과는 아직 공개되지 않았습니다.
      </p>
    </>
  );
}

function ChoiceResultChart({ results }: { results: ChoiceResult[] }) {
  // 분모는 선택 합계(단일 선택은 응답자 수와 동일). 선택지 순서·0표 항목을 모두 유지한다.
  const total = results.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="choiceResultList">
      {results.map((item, index) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const isZero = item.value === 0;
        return (
          <article
            className={`choiceResultRow ${isZero ? 'isZero' : ''}`}
            key={`${item.name}-${index}`}
          >
            <div className="choiceResultContent">
              <div className="choiceResultName">
                <span className="choiceNumber">{index + 1}</span>
                <strong>{item.name}</strong>
              </div>
              <div className="choiceResultValue">
                <strong>{item.value}명</strong>
                <span>{percent}%</span>
              </div>
              <div
                className="choiceResultBarTrack"
                role="img"
                aria-label={`${item.name}: ${item.value}명, ${percent}%`}
              >
                <div className="choiceResultBar" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SubjectiveWaiting({ responseCount }: { responseCount: number }) {
  return (
    <div className="subjectiveWaitingBox">
      <strong>주관식 답변을 받고 있습니다.</strong>
      <p>지금까지 {responseCount}개의 답변이 들어왔습니다.</p>
      <p>결과는 아직 공개되지 않았습니다.</p>
    </div>
  );
}

function SubjectiveAnswerList({ answers }: { answers: TextAnswer[] }) {
  if (answers.length === 0) {
    return (
      <div className="subjectiveWaitingBox">
        <strong>공개된 답변이 없습니다.</strong>
      </div>
    );
  }
  return (
    <div className="subjectiveAnswerGrid">
      {answers.map((answer, index) => (
        <article className="subjectiveAnswerCard" key={`${answer.nickname}-${index}`}>
          {answer.answer}
        </article>
      ))}
    </div>
  );
}

type PresentationStageProps = {
  title: string;
  text: string;
  questionNumber: string;
  typeLabel: string;
  responseCount: number;
  resultVisible: boolean;
  isSubjective: boolean;
  choices: string[];
  choiceResults: ChoiceResult[];
  textAnswers: TextAnswer[];
};

function PresentationStage({
  title,
  text,
  questionNumber,
  typeLabel,
  responseCount,
  resultVisible,
  isSubjective,
  choices,
  choiceResults,
  textAnswers,
}: PresentationStageProps) {
  return (
    <section className="displayStage">
      <DisplayQuestionHeader
        questionNumber={questionNumber}
        typeLabel={typeLabel}
        responseCount={responseCount}
        resultVisible={resultVisible}
      />

      <section className="displayQuestionText">
        <h2>{title}</h2>
        <p>{text}</p>
      </section>

      <section className="displayContentArea">
        {!isSubjective && !resultVisible ? <ChoicePreview choices={choices} /> : null}
        {!isSubjective && resultVisible ? <ChoiceResultChart results={choiceResults} /> : null}
        {isSubjective && !resultVisible ? <SubjectiveWaiting responseCount={responseCount} /> : null}
        {isSubjective && resultVisible ? <SubjectiveAnswerList answers={textAnswers} /> : null}
      </section>
    </section>
  );
}

function NoActiveQuestionState() {
  return (
    <section className="displayStage noActiveQuestionState">
      <h2>진행 중인 질문이 없습니다.</h2>
      <p>강사가 질문을 열면 이 화면에 표시됩니다.</p>
    </section>
  );
}

function NonDisplayableState({ visibility }: { visibility: ResultVisibility }) {
  return (
    <section className="displayStage noActiveQuestionState">
      <h2>발표 화면에 표시되지 않는 질문입니다.</h2>
      <p>
        {visibility === 'teacher-only'
          ? '이 질문 결과는 강사 화면에서만 집계됩니다.'
          : '이 질문은 발표 화면 비노출로 설정되어 있습니다.'}
      </p>
    </section>
  );
}

function DisplayShell({ children }: { children: ReactNode }) {
  return (
    <main className="displayPage">
      <div className="displayShell">
        <header className="displayToolbar">
          <div className="displayTitleBlock">
            <BackLink to="/sessions" label="진행 중인 설문" />
            <h1>발표 화면</h1>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

// Firebase 미설정 시 미리보기: 실제와 동일한 스테이지를 mock 질문으로 렌더한다.
function DisplayPreview() {
  const question = (previewQuestions[1] ?? previewQuestions[0]) as QuestionDoc;
  return (
    <DisplayShell>
      <PresentationStage
        title={question.title?.trim() || getQuestionTypeLabel(question)}
        text={question.prompt?.trim() || '질문 문장이 없습니다.'}
        questionNumber={`Q${String(question.order ?? 1).padStart(2, '0')}`}
        typeLabel={getQuestionTypeLabel(question)}
        responseCount={2}
        resultVisible={false}
        isSubjective={getQuestionInputType(question) === 'text'}
        choices={getQuestionChoices(question)}
        choiceResults={buildChoiceResults(question, [])}
        textAnswers={[]}
      />
    </DisplayShell>
  );
}

export function DisplayPage() {
  const sessionId = useSessionId();
  // Auth is guaranteed by AuthGate (DoroGate SSO) before this page renders.
  const { user } = usePresenterAuth();
  const hasTeacherAuth = Boolean(user) && Boolean(sessionId);
  const { session, questions, activeQuestion, loading, error } = useActiveQuestion(sessionId ?? '', {
    enabled: hasTeacherAuth,
  });
  // 발표 화면은 현재 선택된 질문(activeQuestionId)을 수집→마감→결과 공개까지 이어서 보여준다.
  const { answers, error: answersError } = useAnswers(
    sessionId ?? '',
    hasTeacherAuth ? activeQuestion?.id : undefined,
  );

  if (!firebaseConfigStatus.isConfigured) {
    return <DisplayPreview />;
  }

  if (!sessionId) {
    return (
      <DisplayShell>
        <section className="displayStage noActiveQuestionState">
          <h2>발표할 설문이 선택되지 않았습니다.</h2>
          <p>
            <Link to="/sessions">진행 중인 설문으로 이동</Link>
          </p>
        </section>
      </DisplayShell>
    );
  }

  // 응답 열림/결과 공개 상태는 '지금 실제로 열린 그 질문'에 대해서만 유효하다(단일-오픈 모델).
  const openQuestion =
    questions.find((question) => (question.open ?? false) && Boolean(session?.accepting)) ?? null;
  const isActiveTheOpenOne = Boolean(
    activeQuestion && openQuestion && activeQuestion.id === openQuestion.id,
  );
  const resultVisible =
    isActiveTheOpenOne &&
    Boolean(session?.showResults) &&
    Boolean(activeQuestion && isDisplayableQuestion(activeQuestion));

  let stage: ReactNode;
  if (loading) {
    stage = null;
  } else if (error || answersError) {
    stage = (
      <section className="displayStage">
        <p className="displayStageError">{error ?? answersError}</p>
      </section>
    );
  } else if (!session || !activeQuestion) {
    stage = <NoActiveQuestionState />;
  } else if (!isDisplayableQuestion(activeQuestion)) {
    stage = <NonDisplayableState visibility={getQuestionResultVisibility(activeQuestion)} />;
  } else {
    const index = Math.max(
      0,
      questions.findIndex((question) => question.id === activeQuestion.id),
    );
    stage = (
      <PresentationStage
        title={activeQuestion.title?.trim() || getQuestionTypeLabel(activeQuestion)}
        text={activeQuestion.prompt?.trim() || '질문 문장이 없습니다.'}
        questionNumber={`Q${String(index + 1).padStart(2, '0')}`}
        typeLabel={getQuestionTypeLabel(activeQuestion)}
        responseCount={answers.length}
        resultVisible={resultVisible}
        isSubjective={getQuestionInputType(activeQuestion) === 'text'}
        choices={getQuestionChoices(activeQuestion)}
        choiceResults={buildChoiceResults(activeQuestion, answers)}
        textAnswers={getApprovedTextAnswers(answers)}
      />
    );
  }

  return <DisplayShell>{stage}</DisplayShell>;
}
