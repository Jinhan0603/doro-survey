import { Button } from '../common/Button';
import { Card } from '../common/Card';

type AdminControlsProps = {
  accepting: boolean;
  showResults: boolean;
  onToggleAccepting(): void;
  onToggleResults(): void;
};

export function AdminControls({
  accepting,
  showResults,
  onToggleAccepting,
  onToggleResults,
}: AdminControlsProps) {
  return (
    <Card className="admin-controls">
      <div>
        <h3>운영 제어</h3>
        <p>실제 Firebase 연결 전이라 이 화면은 운영 흐름만 미리 보여줍니다.</p>
      </div>
      <div className="admin-controls__buttons">
        <Button onClick={onToggleAccepting} variant={accepting ? 'primary' : 'secondary'}>
          {accepting ? '답변 받는 중' : '답변 마감'}
        </Button>
        <Button onClick={onToggleResults} variant={showResults ? 'primary' : 'secondary'}>
          {showResults ? '결과 공개 중' : '결과 숨김'}
        </Button>
      </div>
    </Card>
  );
}
