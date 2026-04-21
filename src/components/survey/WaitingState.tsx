import { Card } from '../common/Card';

type WaitingStateProps = {
  title: string;
  description: string;
};

export function WaitingState({ title, description }: WaitingStateProps) {
  return (
    <Card className="waiting-state" tone="muted">
      <div className="waiting-pulse" aria-hidden="true">
        <span className="waiting-pulse__dot" />
        <span className="waiting-pulse__dot" />
        <span className="waiting-pulse__dot" />
      </div>
      <h3 className="waiting-state__title">{title}</h3>
      <p className="waiting-state__desc">{description}</p>
    </Card>
  );
}
