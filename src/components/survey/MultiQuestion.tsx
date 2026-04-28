import clsx from 'clsx';

type MultiQuestionProps = {
  choices: string[];
  selectedChoices: string[];
  onToggle(choice: string): void;
};

export function MultiQuestion({ choices, selectedChoices, onToggle }: MultiQuestionProps) {
  return (
    <div className="multi-choice-grid">
      {choices.map((choice) => {
        const active = selectedChoices.includes(choice);

        return (
          <button
            key={choice}
            aria-pressed={active}
            className={clsx('multi-choice-card', active && 'is-selected')}
            type="button"
            onClick={() => onToggle(choice)}
          >
            <span className="multi-choice-card__box" aria-hidden="true">
              {active ? '✓' : ''}
            </span>
            <span className="multi-choice-card__label">{choice}</span>
          </button>
        );
      })}
    </div>
  );
}
