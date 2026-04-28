import type { ResultVisibility } from '../../firebase/types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

type AdminControlsProps = {
  accepting: boolean;
  showResults: boolean;
  resultVisibility?: ResultVisibility;
  disabled?: boolean;
  note?: string;
  onToggleAccepting(): void;
  onToggleResults(): void;
};

export function AdminControls({
  accepting,
  showResults,
  resultVisibility = 'public',
  disabled = false,
  note = '현재 질문의 응답 수집과 결과 공개 상태를 제어합니다.',
  onToggleAccepting,
  onToggleResults,
}: AdminControlsProps) {
  const displayToggleDisabled = disabled || resultVisibility !== 'public';
  const resultBadgeLabel =
    resultVisibility === 'public'
      ? showResults
        ? '결과 공개 중'
        : '결과 비공개'
      : resultVisibility === 'teacher-only'
        ? '강사 전용 결과'
        : '발표 비표시 질문';

  return (
    <Card className="admin-controls">
      <div>
        <h3>운영 제어</h3>
        <p>{note}</p>
      </div>
      <div className="admin-controls__status-row">
        <Badge tone={accepting ? 'success' : 'default'}>{accepting ? '응답 수집 중' : '응답 마감'}</Badge>
        <Badge tone={resultVisibility === 'public' && showResults ? 'accent' : 'default'}>
          {resultBadgeLabel}
        </Badge>
      </div>
      <div className="admin-controls__buttons">
        <Button disabled={disabled} onClick={onToggleAccepting} variant={accepting ? 'primary' : 'secondary'}>
          {accepting ? '응답 마감하기' : '응답 열기'}
        </Button>
        <Button
          disabled={displayToggleDisabled}
          onClick={onToggleResults}
          variant={showResults ? 'primary' : 'secondary'}
        >
          {resultVisibility === 'public'
            ? showResults
              ? '결과 숨기기'
              : '결과 공개하기'
            : 'Display 비노출'}
        </Button>
      </div>
    </Card>
  );
}
