import { type ChangeEvent } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Trash2, X } from 'lucide-react';
import '../../styles/survey-builder.css';
import { VISIBILITY_LABELS } from '../../data/lessonTemplatePresets';
import type { ResultVisibility } from '../../firebase/types';
import {
  INPUT_TYPE_HELP,
  VISIBILITY_HELP,
  getDefaultChoices,
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
  // UI 유형은 객관식/주관식 2종. 복수 선택은 객관식의 토글로 inputType을 choice↔multi로 매핑한다.
  const baseType: 'choice' | 'text' = draft.inputType === 'text' ? 'text' : 'choice';
  const isMulti = draft.inputType === 'multi';

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const target = event.target.value as 'choice' | 'text';
    if (target === 'text') {
      onPatch(draft.clientId, { inputType: 'text', choicesText: '' });
      return;
    }
    onPatch(draft.clientId, {
      inputType: 'choice',
      choicesText: draft.choicesText.trim() ? draft.choicesText : getDefaultChoices('choice'),
      maxLength: 300,
    });
  };

  const toggleMulti = () => {
    onPatch(draft.clientId, { inputType: isMulti ? 'choice' : 'multi' });
  };

  // choicesText('\n' 구분 문자열)를 단일 소스로 두되, 객관식은 최소 2개를 보장한다.
  // 빈 문자열도 한 행으로 유지하고, 2칸 미만이면 빈 칸으로 채워 표시한다.
  const rawOptions = draft.choicesText.split('\n');
  const options =
    rawOptions.length >= 2 ? rawOptions : [...rawOptions, ...Array(2 - rawOptions.length).fill('')];
  const setOptions = (next: string[]) => onPatch(draft.clientId, { choicesText: next.join('\n') });
  const updateOption = (target: number, value: string) =>
    setOptions(options.map((option, idx) => (idx === target ? value : option)));
  const addOption = () => setOptions([...options, '']);
  const removeOption = (target: number) => {
    // 최소 2개 유지: 2개 이하일 때는 삭제하지 않는다.
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== target));
  };

  const typeHint = baseType === 'text' ? INPUT_TYPE_HELP.text : isMulti ? INPUT_TYPE_HELP.multi : INPUT_TYPE_HELP.choice;

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
              <label className="formLabel" htmlFor={typeId}>
                응답 방식
              </label>
              <select id={typeId} className="formSelect" value={baseType} onChange={handleTypeChange}>
                <option value="choice">객관식</option>
                <option value="text">주관식</option>
              </select>
              <p className="formHint">{typeHint}</p>
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

          {baseType === 'text' ? (
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

          {baseType === 'choice' ? (
            <div className="optionEditor">
              <div className="optionEditorHead">
                <span className="formLabel optionEditorLabel">선택지</span>
                <label className="multiToggle">
                  <input type="checkbox" checked={isMulti} onChange={toggleMulti} />
                  복수 선택 허용
                </label>
              </div>
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
                    {options.length > 2 ? (
                      <button
                        type="button"
                        className="optionRemoveButton"
                        aria-label={`선택지 ${optionIndex + 1} 삭제`}
                        onClick={() => removeOption(optionIndex)}
                      >
                        <X size={14} />
                      </button>
                    ) : null}
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
