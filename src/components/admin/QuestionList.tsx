import clsx from 'clsx';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import type { PreviewQuestion } from '../../data/previewQuestions';

type QuestionListProps = {
  questions: PreviewQuestion[];
  activeQuestionId: string;
  onSelect(questionId: string): void;
};

export function QuestionList({ questions, activeQuestionId, onSelect }: QuestionListProps) {
  return (
    <Card className="question-list-card">
      <div className="section-heading">
        <h3>질문 목록</h3>
        <Badge>{questions.length} items</Badge>
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
            <strong>{question.title}</strong>
            <small>{question.type === 'choice' ? '객관식' : '주관식'}</small>
          </button>
        ))}
      </div>
    </Card>
  );
}
