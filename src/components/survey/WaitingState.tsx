import { Card } from '../common/Card';

type WaitingStateProps = {
  title: string;
  description: string;
};

export function WaitingState({ title, description }: WaitingStateProps) {
  return (
    <Card className="waiting-state" tone="muted">
      <span className="question-card__step">WAITING</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </Card>
  );
}
