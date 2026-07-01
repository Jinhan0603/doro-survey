import clsx from 'clsx';
import { Card } from '../common/Card';
import type { QuestionDoc } from '../../firebase/types';
import { getQuestionTypeLabel } from '../../utils/questionRuntime';

type QuestionListProps = {
  questions: Array<Pick<QuestionDoc, 'id' | 'order' | 'title' | 'prompt' | 'type' | 'inputType' | 'open'>>;
  activeQuestionId: string;
  disabled?: boolean;
  onSelect(questionId: string): void;
  onToggleOpen(questionId: string, nextOpen: boolean): void;
};

export function QuestionList({
  questions,
  activeQuestionId,
  disabled = false,
  onSelect,
  onToggleOpen,
}: QuestionListProps) {
  return (
    <Card className="question-list-card">
      <div className="section-heading">
        <h3>질문 목록</h3>
      </div>
      <div className="question-list">
        {questions.map((question) => {
          const open = question.open ?? false;
          return (
            <div key={question.id} className="question-list__row">
              <button
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
              <button
                className={clsx('question-list__open-toggle', open && 'is-open')}
                onClick={() => onToggleOpen(question.id, !open)}
                disabled={disabled}
                aria-pressed={open}
                title={open ? '학생 답변을 닫습니다' : '학생 답변을 엽니다'}
                type="button"
              >
                {open ? '열림' : '닫힘'}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
