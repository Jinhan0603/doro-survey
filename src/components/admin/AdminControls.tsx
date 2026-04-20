import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

type AdminControlsProps = {
  accepting: boolean;
  showResults: boolean;
  disabled?: boolean;
  note?: string;
  onToggleAccepting(): void;
  onToggleResults(): void;
};

export function AdminControls({
  accepting,
  showResults,
  disabled = false,
  note = '현재 질문의 응답 수집과 결과 공개 상태를 제어합니다.',
  onToggleAccepting,
  onToggleResults,
}: AdminControlsProps) {
  return (
    <Card className="admin-controls">
      <div>
        <h3>운영 제어</h3>
        <p>{note}</p>
      </div>
      <div className="admin-controls__status-row">
        <Badge tone={accepting ? 'success' : 'default'}>{accepting ? '응답 수집 중' : '응답 마감'}</Badge>
        <Badge tone={showResults ? 'accent' : 'default'}>{showResults ? '결과 공개 중' : '결과 비공개'}</Badge>
      </div>
      <div className="admin-controls__buttons">
        <Button disabled={disabled} onClick={onToggleAccepting} variant={accepting ? 'primary' : 'secondary'}>
          {accepting ? '답변 받는 중' : '답변 마감'}
        </Button>
        <Button disabled={disabled} onClick={onToggleResults} variant={showResults ? 'primary' : 'secondary'}>
          {showResults ? '결과 공개 중' : '결과 숨김'}
        </Button>
      </div>
    </Card>
  );
}
