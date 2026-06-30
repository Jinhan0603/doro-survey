import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  INPUT_TYPE_LABELS,
  INTERACTION_LABELS,
  PURPOSE_LABELS,
  VISIBILITY_LABELS,
} from '../../data/lessonTemplatePresets';
import type {
  InteractionPurpose,
  InteractionType,
  QuestionInputType,
  ResultVisibility,
} from '../../firebase/types';
import type { EditableInteraction } from './builderModel';

type InteractionEditorCardProps = {
  interaction: EditableInteraction;
  index: number;
  onInteractionPatch: (clientId: string, patch: Partial<EditableInteraction>) => void;
  onInteractionDelete: (clientId: string) => void;
  onInteractionMove: (clientId: string, direction: -1 | 1) => void;
};

export function InteractionEditorCard({
  interaction,
  index,
  onInteractionPatch,
  onInteractionDelete,
  onInteractionMove,
}: InteractionEditorCardProps) {
  return (
    <div className="builder-interaction-card">
      <div className="builder-interaction-card__header">
        <div className="builder-interaction-card__title-row">
          <span className="builder-interaction-card__index">
            Q{index + 1}
          </span>
          <Input
            aria-label="질문 제목"
            value={interaction.title}
            placeholder="질문 제목"
            onChange={(event) => onInteractionPatch(interaction.clientId, { title: event.target.value })}
          />
        </div>
        <div className="builder-interaction-card__actions">
          <Button
            aria-label="Move interaction up"
            size="sm"
            variant="ghost"
            onClick={() => onInteractionMove(interaction.clientId, -1)}
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            aria-label="Move interaction down"
            size="sm"
            variant="ghost"
            onClick={() => onInteractionMove(interaction.clientId, 1)}
          >
            <ArrowDown size={16} />
          </Button>
          <Button
            aria-label="Delete interaction"
            size="sm"
            variant="ghost"
            onClick={() => onInteractionDelete(interaction.clientId)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="builder-interaction-card__grid">
        <label className="form-field">
          <span className="form-label">질문 역할</span>
          <select
            className="select-sm"
            value={interaction.interactionType}
            onChange={(event) =>
              onInteractionPatch(
                interaction.clientId,
                { interactionType: event.target.value as InteractionType },
              )
            }
          >
            {(Object.entries(INTERACTION_LABELS) as [InteractionType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">사용 목적</span>
          <select
            className="select-sm"
            value={interaction.purpose}
            onChange={(event) =>
              onInteractionPatch(
                interaction.clientId,
                { purpose: event.target.value as InteractionPurpose },
              )
            }
          >
            {(Object.entries(PURPOSE_LABELS) as [InteractionPurpose, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">결과 공개 범위</span>
          <select
            className="select-sm"
            value={interaction.visibility}
            onChange={(event) =>
              onInteractionPatch(
                interaction.clientId,
                { visibility: event.target.value as ResultVisibility },
              )
            }
          >
            {(Object.entries(VISIBILITY_LABELS) as [ResultVisibility, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">응답 방식</span>
          <select
            className="select-sm"
            value={interaction.inputType}
            onChange={(event) =>
              onInteractionPatch(
                interaction.clientId,
                { inputType: event.target.value as QuestionInputType },
              )
            }
          >
            {(Object.entries(INPUT_TYPE_LABELS) as [QuestionInputType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="진행 시간"
          value={interaction.timingLabel ?? ''}
          placeholder="예: 3분"
          onChange={(event) =>
            onInteractionPatch(interaction.clientId, { timingLabel: event.target.value })
          }
        />
      </div>

      <label className="form-field">
        <span className="form-label">질문 문장</span>
        <textarea
          className="textarea"
          rows={3}
          value={interaction.prompt}
          placeholder="학생에게 보여줄 질문 문구"
          onChange={(event) => onInteractionPatch(interaction.clientId, { prompt: event.target.value })}
        />
      </label>

      {(interaction.inputType === 'choice' ||
        interaction.inputType === 'multi' ||
        interaction.inputType === 'status' ||
        interaction.inputType === 'scale') ? (
        <label className="form-field">
          <span className="form-label">선택지</span>
          <textarea
            className="textarea"
            rows={3}
            value={interaction.choices.join('\n')}
            placeholder="한 줄에 하나씩 입력"
            onChange={(event) =>
              onInteractionPatch(
                interaction.clientId,
                {
                  choices: event.target.value
                    .split('\n')
                    .map((choice) => choice.trim())
                    .filter(Boolean),
                },
              )
            }
          />
        </label>
      ) : null}

      <div className="builder-interaction-card__bottom-grid">
        <Input
          label="답변 최대 글자 수"
          min={50}
          max={300}
          step={10}
          type="number"
          value={interaction.maxLength}
          onChange={(event) =>
            onInteractionPatch(interaction.clientId, {
              maxLength: Math.max(50, Math.min(300, Number(event.target.value) || 300)),
            })
          }
        />
        <label className="form-field">
          <span className="form-label">강사용 진행 메모</span>
          <textarea
            className="textarea"
            rows={3}
            value={interaction.presenterNote ?? ''}
            placeholder="강사용 진행 메모"
            onChange={(event) =>
              onInteractionPatch(interaction.clientId, { presenterNote: event.target.value })
            }
          />
        </label>
      </div>
    </div>
  );
}
