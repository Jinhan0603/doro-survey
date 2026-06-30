import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { StatusSummary } from '../common/StatusSummary';
import type { QuestionDoc } from '../../firebase/types';

type StatusResult = { name: string; value: number };

type StatusInsightCardProps = {
  question: QuestionDoc;
  answersCount: number;
  statusResults: StatusResult[];
  completedCount: number;
  needHelpCount: number;
};

export function StatusInsightCard({
  question,
  answersCount,
  statusResults,
  completedCount,
  needHelpCount,
}: StatusInsightCardProps) {
  return (
    <Card className="metric-panel">
      <div className="section-heading">
        <h3>
          {question.interactionType === 'readiness-check'
            ? '실습 준비 상태'
            : question.interactionType === 'progress-check'
              ? '실습 진행 상태'
              : '상태 집계'}
        </h3>
        <Badge tone="accent">{answersCount} responses</Badge>
      </div>
      <StatusSummary items={statusResults.map((item) => ({ label: item.name, value: item.value }))} />
      <div className="inline-message">
        {question.interactionType === 'readiness-check'
          ? `ready/done ${completedCount}명, need_help ${needHelpCount}명으로 실습 시작 가능 상태를 빠르게 확인할 수 있습니다.`
          : question.interactionType === 'progress-check'
            ? `done/ready ${completedCount}명, need_help ${needHelpCount}명으로 중간 점검 상태를 빠르게 해석할 수 있습니다.`
            : `현재 상태 응답 ${answersCount}개를 Admin에서만 실시간 집계 중입니다.`}
      </div>
    </Card>
  );
}
