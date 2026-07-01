import type { QuestionDoc } from '../../firebase/types';
import { useAnswers } from '../../hooks/useAnswers';
import {
  getQuestionInputType,
  getQuestionResultVisibility,
  isDisplayableQuestion,
} from '../../utils/questionRuntime';
import { buildChoiceResults, buildStatusResults, getApprovedTextAnswers } from '../../utils/stats';
import { Card } from '../common/Card';
import { StatusSummary } from '../common/StatusSummary';
import { AnswerWall } from '../display/AnswerWall';
import { DisplayStage } from '../display/DisplayStage';
import { ResultChart } from '../display/ResultChart';

type StudentQuestionResultsProps = {
  sessionId: string;
  question: QuestionDoc;
};

// 결과가 공개된 '그 질문'의 집계 결과를 학생 화면에 보여준다(발표 화면과 동일한 렌더).
export function StudentQuestionResults({ sessionId, question }: StudentQuestionResultsProps) {
  const { answers, error } = useAnswers(sessionId, question.id);
  const questionLabel = `Q${String(question.order).padStart(2, '0')}`;

  if (!isDisplayableQuestion(question)) {
    return (
      <Card className="collecting-stage" tone="muted">
        <strong>결과가 공개되지 않는 질문입니다</strong>
        <span>
          {getQuestionResultVisibility(question) === 'teacher-only'
            ? '이 질문 결과는 강사에게만 공개됩니다.'
            : '이 질문 결과는 공개되지 않습니다.'}
        </span>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="collecting-stage" tone="muted">
        <strong>결과를 불러오는 중입니다</strong>
        <span>잠시 후에도 표시되지 않으면 화면을 새로고침해주세요.</span>
      </Card>
    );
  }

  const inputType = getQuestionInputType(question);

  if (inputType === 'text') {
    const approvedAnswers = getApprovedTextAnswers(answers);
    return (
      <DisplayStage
        prompt={question.prompt}
        questionLabel={questionLabel}
        responseCount={approvedAnswers.length}
        title={question.title}
      >
        <AnswerWall answers={approvedAnswers} />
      </DisplayStage>
    );
  }

  if (inputType === 'status') {
    return (
      <DisplayStage
        prompt={question.prompt}
        questionLabel={questionLabel}
        responseCount={answers.length}
        title={question.title}
      >
        <StatusSummary
          items={buildStatusResults(question, answers).map((item) => ({
            label: item.name,
            value: item.value,
          }))}
        />
      </DisplayStage>
    );
  }

  return (
    <DisplayStage
      prompt={question.prompt}
      questionLabel={questionLabel}
      responseCount={answers.length}
      title={question.title}
    >
      <ResultChart data={buildChoiceResults(question, answers)} />
    </DisplayStage>
  );
}
