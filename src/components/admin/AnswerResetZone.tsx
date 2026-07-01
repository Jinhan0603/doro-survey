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
        <p className="danger-zone__desc">
          테스트 응답을 삭제하고 설문을 깨끗하게 시작할 수 있습니다.<br />
          삭제 후에는 되돌릴 수 없습니다.
        </p>
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
