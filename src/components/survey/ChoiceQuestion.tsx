import clsx from 'clsx';
import { Button } from '../common/Button';

type ChoiceQuestionProps = {
  choices: string[];
  selectedChoice?: string;
  layout?: 'stack' | 'compact';
  onSelect(choice: string): void;
};

export function ChoiceQuestion({
  choices,
  selectedChoice,
  layout = 'stack',
  onSelect,
}: ChoiceQuestionProps) {
  return (
    <div className={clsx('choice-grid', layout === 'compact' && 'choice-grid--compact')}>
      {choices.map((choice) => {
        const active = choice === selectedChoice;

        return (
          <Button
            key={choice}
            aria-pressed={active}
            className={active ? 'choice-button is-selected' : 'choice-button'}
            fullWidth
            size="lg"
            variant={active ? 'primary' : 'secondary'}
            onClick={() => onSelect(choice)}
          >
            {choice}
          </Button>
        );
      })}
    </div>
  );
}
