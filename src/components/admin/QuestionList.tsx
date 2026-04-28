import clsx from 'clsx';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import type { QuestionDoc } from '../../firebase/types';
import { getQuestionTypeLabel } from '../../utils/questionRuntime';

type QuestionListProps = {
  questions: Array<Pick<QuestionDoc, 'id' | 'order' | 'title' | 'prompt' | 'type' | 'inputType'>>;
  activeQuestionId: string;
  onSelect(questionId: string): void;
};

export function QuestionList({ questions, activeQuestionId, onSelect }: QuestionListProps) {
  return (
    <Card className="question-list-card">
      <div className="section-heading">
        <h3>질문 목록</h3>
        <Badge>{questions.length} questions</Badge>
      </div>
      <div className="question-list">
        {questions.map((question) => (
          <button
            key={question.id}
            className={clsx('question-list__item', question.id === activeQuestionId && 'is-active')}
            onClick={() => onSelect(question.id)}
            type="button"
          >
            <span className="question-list__order">Q{String(question.order).padStart(2, '0')}</span>
            <div className="question-list__copy">
              <strong>{question.title}</strong>
              <small>{question.prompt}</small>
            </div>
            <small className="question-list__type">{getQuestionTypeLabel(question)}</small>
          </button>
        ))}
      </div>
    </Card>
  );
}
