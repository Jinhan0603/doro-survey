import type { ReactNode } from 'react';
import { Card } from '../common/Card';

type QuestionCardProps = {
  stepLabel: string;
  title: string;
  prompt: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function QuestionCard({ stepLabel, title, prompt, children, footer }: QuestionCardProps) {
  return (
    <Card className="question-card">
      <div className="question-card__head">
        <span className="question-card__step">{stepLabel}</span>
        <h2>{title}</h2>
        <p>{prompt}</p>
      </div>
      {children}
      {footer ? <div className="question-card__footer">{footer}</div> : null}
    </Card>
  );
}
