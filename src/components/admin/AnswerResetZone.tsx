import { Button } from '../common/Button';

type AnswerResetZoneProps = {
  busy: boolean;
  hasActiveQuestion: boolean;
  hasQuestions: boolean;
  onResetQuestion: () => void;
  onResetSession: () => void;
};

export function AnswerResetZone({
  busy,
  hasActiveQuestion,
  hasQuestions,
  onResetQuestion,
  onResetSession,
}: AnswerResetZoneProps) {
  return (
    <div className="danger-zone">
      <div className="danger-zone__header">
        <h3 className="danger-zone__title">응답 초기화</h3>
      </div>
      <div className="danger-zone__buttons">
        <Button
          className="button--danger"
          disabled={busy || !hasActiveQuestion}
          size="sm"
          variant="secondary"
          onClick={onResetQuestion}
        >
          현재 질문 응답 초기화
        </Button>
        <Button
          className="button--danger button--danger-strong"
          disabled={busy || !hasQuestions}
          size="sm"
          variant="secondary"
          onClick={onResetSession}
        >
          전체 응답 초기화
        </Button>
      </div>
    </div>
  );
}
