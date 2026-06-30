import { type ChangeEvent } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Trash2, X } from 'lucide-react';
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

  // choicesText('\n' 구분 문자열)를 단일 소스로 두고, UI에서만 행 단위로 편집한다.
  const showOptions = hasChoiceOptions(draft.inputType);
  const options = draft.choicesText.length > 0 ? draft.choicesText.split('\n') : [];
  const setOptions = (next: string[]) => onPatch(draft.clientId, { choicesText: next.join('\n') });
  const updateOption = (target: number, value: string) =>
    setOptions(options.map((option, idx) => (idx === target ? value : option)));
  const addOption = () => setOptions([...options, '']);
  const removeOption = (target: number) => setOptions(options.filter((_, idx) => idx !== target));

  const phaseId = `phase-${draft.clientId}`;
  const typeId = `type-${draft.clientId}`;
  const visibilityId = `visibility-${draft.clientId}`;
  const maxLengthId = `maxlen-${draft.clientId}`;
  const promptId = `prompt-${draft.clientId}`;

  return (
    <div className="questionCard">
      <div className="questionCardInner">
        <span className="questionNumberBadge">Q{String(index + 1).padStart(2, '0')}</span>

        <div className="questionMain">
          <div className="questionTopRow">
            <input
              className="questionTitleInput"
              aria-label={`Q${index + 1} 제목`}
              placeholder="질문 제목"
              value={draft.title}
              onChange={(event) => onPatch(draft.clientId, { title: event.target.value })}
            />
            <div className="questionCardActions">
              <button
                type="button"
                className="iconButton"
                aria-label="질문 위로 이동"
                onClick={() => onMove(draft.clientId, -1)}
              >
                <ArrowUp size={18} />
              </button>
              <button
                type="button"
                className="iconButton"
                aria-label="질문 아래로 이동"
                onClick={() => onMove(draft.clientId, 1)}
              >
                <ArrowDown size={18} />
              </button>
              <button
                type="button"
                className="iconButton danger"
                aria-label="질문 삭제"
                disabled={!canDelete}
                onClick={() => onDelete(draft.clientId)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="questionSettingsGrid">
            <div className="formField">
              <label className="formLabel" htmlFor={phaseId}>
                수업 구간
              </label>
              <select
                id={phaseId}
                className="formSelect"
                value={draft.phase}
                onChange={(event) => onPatch(draft.clientId, { phase: event.target.value as LessonPhase })}
              >
                {PHASE_ORDER.map((phase) => (
                  <option key={phase} value={phase}>
                    {PHASE_LABELS[phase]}
                  </option>
                ))}
              </select>
            </div>

            <div className="formField">
              <label className="formLabel" htmlFor={typeId}>
                응답 방식
              </label>
              <select id={typeId} className="formSelect" value={draft.inputType} onChange={handleInputTypeChange}>
                {(Object.entries(INPUT_TYPE_LABELS) as [QuestionInputType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="formHint">{INPUT_TYPE_HELP[draft.inputType]}</p>
            </div>

            <div className="formField">
              <label className="formLabel" htmlFor={visibilityId}>
                결과 공개 범위
              </label>
              <select
                id={visibilityId}
                className="formSelect"
                value={draft.visibility}
                onChange={(event) => onPatch(draft.clientId, { visibility: event.target.value as ResultVisibility })}
              >
                {(Object.entries(VISIBILITY_LABELS) as [ResultVisibility, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="formHint">{VISIBILITY_HELP[draft.visibility]}</p>
            </div>
          </div>

          {draft.inputType === 'text' ? (
            <div className="questionBodyField">
              <label className="formLabel" htmlFor={maxLengthId}>
                최대 글자 수
              </label>
              <input
                id={maxLengthId}
                className="formInput"
                type="number"
                min={50}
                max={300}
                step={10}
                value={draft.maxLength}
                onChange={(event) =>
                  onPatch(draft.clientId, {
                    maxLength: Math.max(50, Math.min(300, Number(event.target.value) || 300)),
                  })
                }
              />
            </div>
          ) : null}

          <div className="questionBodyField">
            <label className="formLabel" htmlFor={promptId}>
              질문 문장
            </label>
            <textarea
              id={promptId}
              className="questionTextarea"
              placeholder="학생에게 보일 질문을 입력하세요."
              value={draft.prompt}
              onChange={(event) => onPatch(draft.clientId, { prompt: event.target.value })}
            />
          </div>

          {showOptions ? (
            <div className="optionEditor">
              <span className="formLabel">선택지</span>
              <div className="optionList">
                {options.map((option, optionIndex) => (
                  <div className="optionRow" key={optionIndex}>
                    <span className="optionDragHandle" aria-hidden="true">
                      <GripVertical size={16} />
                    </span>
                    <input
                      className="optionInput"
                      aria-label={`선택지 ${optionIndex + 1}`}
                      value={option}
                      onChange={(event) => updateOption(optionIndex, event.target.value)}
                    />
                    <button
                      type="button"
                      className="optionRemoveButton"
                      aria-label={`선택지 ${optionIndex + 1} 삭제`}
                      onClick={() => removeOption(optionIndex)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="addOptionButton" onClick={addOption}>
                + 선택지 추가
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
