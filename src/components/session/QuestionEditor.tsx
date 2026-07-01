import { type ChangeEvent, useMemo } from 'react';
import { ArrowDown, ArrowUp, GripVertical, Trash2, X } from 'lucide-react';
import '../../styles/survey-builder.css';
import { makeChoiceId } from '../../utils/questionRuntime';
import {
  INPUT_TYPE_HELP,
  getDefaultChoices,
  type ChoiceDraft,
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
      onPatch(draft.clientId, { inputType: 'text', choices: [] });
      return;
    }
    const hasText = draft.choices.some((choice) => choice.text.trim());
    onPatch(draft.clientId, {
      inputType: 'choice',
      choices: hasText ? draft.choices : getDefaultChoices('choice'),
      maxLength: 300,
    });
  };

  const toggleMulti = () => {
    onPatch(draft.clientId, { inputType: isMulti ? 'choice' : 'multi' });
  };

  // 선택지는 {id,text}[]를 단일 소스로 두되, 객관식은 최소 2개를 보장한다.
  // 2칸 미만이면 빈 칸(새 id 부여)으로 채워 표시한다. 패딩 id는 렌더 간 안정적으로 유지한다.
  const options = useMemo<ChoiceDraft[]>(() => {
    if (draft.choices.length >= 2) return draft.choices;
    const padded = [...draft.choices];
    while (padded.length < 2) {
      padded.push({ id: makeChoiceId(), text: '' });
    }
    return padded;
  }, [draft.choices]);
  const setOptions = (next: ChoiceDraft[]) => onPatch(draft.clientId, { choices: next });
  const updateOption = (target: number, value: string) =>
    setOptions(options.map((option, idx) => (idx === target ? { ...option, text: value } : option)));
  const addOption = () => setOptions([...options, { id: makeChoiceId(), text: '' }]);
  const removeOption = (target: number) => {
    // 최소 2개 유지: 2개 이하일 때는 삭제하지 않는다.
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== target));
  };

  const typeHint = baseType === 'text' ? INPUT_TYPE_HELP.text : isMulti ? INPUT_TYPE_HELP.multi : INPUT_TYPE_HELP.choice;

  const typeId = `type-${draft.clientId}`;
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
                  <div className="optionRow" key={option.id}>
                    <span className="optionDragHandle" aria-hidden="true">
                      <GripVertical size={16} />
                    </span>
                    <input
                      className="optionInput"
                      aria-label={`선택지 ${optionIndex + 1}`}
                      value={option.text}
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
