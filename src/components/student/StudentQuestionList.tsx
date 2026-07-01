import clsx from 'clsx';
import type { AnswerDoc, QuestionDoc } from '../../firebase/types';
import { Card } from '../common/Card';

type StudentQuestionListProps = {
  questions: QuestionDoc[];
  ownAnswers: Record<string, AnswerDoc | null>;
  // 세션 전체 마스터 스위치. 질문이 open이어도 이게 false면 답변 불가.
  accepting: boolean;
  onSelect(questionId: string): void;
};

export function StudentQuestionList({
  questions,
  ownAnswers,
  accepting,
  onSelect,
}: StudentQuestionListProps) {
  return (
    <Card className="student-question-list-card">
      <div className="student-question-list__head">
        <h2>질문 목록</h2>
        <p>강사님이 연 질문을 눌러 답변하세요. 열린 질문은 언제든 다시 수정할 수 있어요.</p>
      </div>
      <ul className="student-question-list">
        {questions.map((question) => {
          const answered = Boolean(ownAnswers[question.id]);
          const isOpen = (question.open ?? false) && accepting;
          const statusLabel = isOpen
            ? answered
              ? '제출완료 · 수정 가능'
              : '열림 · 답하기'
            : answered
              ? '제출완료'
              : '대기 중';
          const tone = isOpen ? 'open' : answered ? 'done' : 'wait';
          return (
            <li key={question.id}>
              <button
                type="button"
                className={clsx('student-question-item', `is-${tone}`, !isOpen && 'is-locked')}
                disabled={!isOpen}
                onClick={() => {
                  if (isOpen) onSelect(question.id);
                }}
              >
                <span className="student-question-item__order">
                  질문 {String(question.order).padStart(2, '0')}
                </span>
                <strong className="student-question-item__title">{question.title}</strong>
                <span className="student-question-item__status">{statusLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
