import type { ReactNode } from 'react';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

type DisplayStageProps = {
  questionLabel: string;
  title: string;
  prompt: string;
  responseCount: number;
  children: ReactNode;
};

export function DisplayStage({
  questionLabel,
  title,
  prompt,
  responseCount,
  children,
}: DisplayStageProps) {
  return (
    <Card className="display-stage">
      <div className="display-stage__head">
        <div>
          <Badge tone="accent">{questionLabel}</Badge>
          <h2>{title}</h2>
          <p>{prompt}</p>
        </div>
        <div className="display-stage__metric">
          <span>응답 수</span>
          <strong>{responseCount}</strong>
        </div>
      </div>
      {children}
    </Card>
  );
}
