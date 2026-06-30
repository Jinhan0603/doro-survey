import { type ChangeEvent } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  INPUT_TYPE_LABELS,
  PHASE_LABELS,
  PHASE_ORDER,
  VISIBILITY_LABELS,
} from '../../data/lessonTemplatePresets';
import type { LessonPhase, QuestionInputType, ResultVisibility } from '../../firebase/types';
import {
  INPUT_TYPE_HELP,
  VISIBILITY_HELP,
  getDefaultChoices,
  hasChoiceOptions,
  type CustomQuestionDraft,
} from './customQuestionDraft';

type QuestionEditorProps = {
  draft: CustomQuestionDraft;
  index: number;
  canDelete: boolean;
  onPatch: (clientId: string, patch: Partial<CustomQuestionDraft>) => void;
  onDelete: (clientId: string) => void;
  onMove: (clientId: string, direction: -1 | 1) => void;
};

export function QuestionEditor({
  draft,
  index,
  canDelete,
  onPatch,
  onDelete,
  onMove,
}: QuestionEditorProps) {
  const handleInputTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const inputType = event.target.value as QuestionInputType;
    const previousDefaultChoices = getDefaultChoices(draft.inputType);
    const shouldReplaceChoices = !draft.choicesText.trim() || draft.choicesText === previousDefaultChoices;

    onPatch(draft.clientId, {
      inputType,
      choicesText: hasChoiceOptions(inputType)
        ? shouldReplaceChoices
          ? getDefaultChoices(inputType)
          : draft.choicesText
        : '',
      maxLength: inputType === 'text' ? draft.maxLength : 300,
    });
  };

  return (
    <div className="builder-interaction-card custom-question-card">
      <div className="builder-interaction-card__header">
        <div className="builder-interaction-card__title-row">
          <span className="builder-interaction-card__index">Q{String(index + 1).padStart(2, '0')}</span>
          <Input
            aria-label={`Q${index + 1} 제목`}
            placeholder="질문 제목"
            value={draft.title}
            onChange={(event) => onPatch(draft.clientId, { title: event.target.value })}
          />
        </div>
        <div className="builder-interaction-card__actions">
          <Button
            aria-label="질문 위로 이동"
            size="sm"
            variant="ghost"
            onClick={() => onMove(draft.clientId, -1)}
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            aria-label="질문 아래로 이동"
            size="sm"
            variant="ghost"
            onClick={() => onMove(draft.clientId, 1)}
          >
            <ArrowDown size={16} />
          </Button>
          <Button
            aria-label="질문 삭제"
            disabled={!canDelete}
            size="sm"
            variant="ghost"
            onClick={() => onDelete(draft.clientId)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="builder-interaction-card__grid">
        <label className="form-field">
          <span className="form-label">수업 구간</span>
          <select
            className="select-sm"
            value={draft.phase}
            onChange={(event) => onPatch(draft.clientId, { phase: event.target.value as LessonPhase })}
          >
            {PHASE_ORDER.map((phase) => (
              <option key={phase} value={phase}>
                {PHASE_LABELS[phase]}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">응답 방식</span>
          <select className="select-sm" value={draft.inputType} onChange={handleInputTypeChange}>
            {(Object.entries(INPUT_TYPE_LABELS) as [QuestionInputType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="form-hint">{INPUT_TYPE_HELP[draft.inputType]}</span>
        </label>

        <label className="form-field">
          <span className="form-label">결과 공개 범위</span>
          <select
            className="select-sm"
            value={draft.visibility}
            onChange={(event) => onPatch(draft.clientId, { visibility: event.target.value as ResultVisibility })}
          >
            {(Object.entries(VISIBILITY_LABELS) as [ResultVisibility, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="form-hint">{VISIBILITY_HELP[draft.visibility]}</span>
        </label>

        {draft.inputType === 'text' ? (
          <Input
            label="최대 글자 수"
            max={300}
            min={50}
            step={10}
            type="number"
            value={draft.maxLength}
            onChange={(event) =>
              onPatch(draft.clientId, {
                maxLength: Math.max(50, Math.min(300, Number(event.target.value) || 300)),
              })
            }
          />
        ) : null}
      </div>

      <label className="form-field">
        <span className="form-label">질문 문장</span>
        <textarea
          className="textarea"
          placeholder="학생 화면에 그대로 보일 질문을 입력하세요."
          rows={3}
          value={draft.prompt}
          onChange={(event) => onPatch(draft.clientId, { prompt: event.target.value })}
        />
      </label>

      {hasChoiceOptions(draft.inputType) ? (
        <label className="form-field">
          <span className="form-label">선택지</span>
          <textarea
            className="textarea"
            placeholder="학생이 고를 항목을 한 줄에 하나씩 입력하세요."
            rows={4}
            value={draft.choicesText}
            onChange={(event) => onPatch(draft.clientId, { choicesText: event.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
}
