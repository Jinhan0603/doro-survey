import { FileUp, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { INPUT_TYPE_LABELS, INTERACTION_LABELS, VISIBILITY_LABELS } from '../../data/lessonTemplatePresets';
import {
  type GeneratedInteractionDraft,
  type InteractionGeneratorAudienceLevel,
  type InteractionGeneratorDensity,
  type InteractionGeneratorSubjectType,
} from '../../utils/interactionGenerator';
import type { GeneratorOptionsState } from './builderModel';

const SUBJECT_TYPE_LABELS: Record<InteractionGeneratorSubjectType, string> = {
  ai: 'AI',
  robot: '로봇',
  making: '메이킹',
  coding: '코딩',
  mixed: '혼합형',
};

const AUDIENCE_LEVEL_LABELS: Record<InteractionGeneratorAudienceLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
  university: '대학',
};

const DENSITY_LABELS: Record<InteractionGeneratorDensity, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

type PptxExtractModalProps = {
  open: boolean;
  onClose: () => void;
  uploadingPptx: boolean;
  sourceFileName: string | null;
  slideCount: number;
  pptxError: string | null;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  generatorOptions: GeneratorOptionsState;
  onOptionPatch: (patch: Partial<GeneratorOptionsState>) => void;
  onGenerate: () => void;
  drafts: GeneratedInteractionDraft[];
  generatorError: string | null;
  generatorMessage: string | null;
  onApply: () => void;
};

// PPTX 추출 워크플로우를 한곳에 모은 모달: 업로드 → 옵션 → 생성 → 미리보기 → 적용.
export function PptxExtractModal({
  open,
  onClose,
  uploadingPptx,
  sourceFileName,
  slideCount,
  pptxError,
  onUpload,
  generatorOptions,
  onOptionPatch,
  onGenerate,
  drafts,
  generatorError,
  generatorMessage,
  onApply,
}: PptxExtractModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="builder-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="builder-modal" onClick={(event) => event.stopPropagation()}>
        <div className="builder-section-head">
          <div>
            <h3>PPTX에서 질문 추출</h3>
            <p>원본 PPTX는 브라우저에서만 읽고 저장하지 않습니다. 추출된 텍스트로 질문 초안을 만듭니다.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>

        <label className="builder-upload-dropzone">
          <input
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="builder-upload-dropzone__input"
            type="file"
            onChange={onUpload}
          />
          <FileUp size={20} />
          <strong>
            {uploadingPptx
              ? 'PPTX 분석 중...'
              : sourceFileName
                ? `${sourceFileName} · 슬라이드 ${slideCount}개`
                : 'PPTX 업로드'}
          </strong>
          <span>슬라이드 텍스트를 읽어 질문 초안을 만듭니다.</span>
        </label>

        {pptxError ? <div className="inline-message inline-message--error">{pptxError}</div> : null}

        <div className="builder-generator-grid">
          <label className="form-field">
            <span className="form-label">수업 분야</span>
            <select
              className="select-sm"
              value={generatorOptions.subjectType}
              onChange={(event) =>
                onOptionPatch({ subjectType: event.target.value as InteractionGeneratorSubjectType })
              }
            >
              {(Object.entries(SUBJECT_TYPE_LABELS) as [InteractionGeneratorSubjectType, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">대상 수준</span>
            <select
              className="select-sm"
              value={generatorOptions.audienceLevel}
              onChange={(event) =>
                onOptionPatch({ audienceLevel: event.target.value as InteractionGeneratorAudienceLevel })
              }
            >
              {(Object.entries(AUDIENCE_LEVEL_LABELS) as [InteractionGeneratorAudienceLevel, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">질문 밀도</span>
            <select
              className="select-sm"
              value={generatorOptions.density}
              onChange={(event) =>
                onOptionPatch({ density: event.target.value as InteractionGeneratorDensity })
              }
            >
              {(Object.entries(DENSITY_LABELS) as [InteractionGeneratorDensity, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="builder-toolbar__actions">
          <Button size="sm" variant="secondary" disabled={slideCount === 0} onClick={onGenerate}>
            <Sparkles size={16} />
            질문 생성
          </Button>
          <Button size="sm" disabled={drafts.length === 0} onClick={onApply}>
            적용하기{drafts.length > 0 ? ` (${drafts.length})` : ''}
          </Button>
        </div>

        {generatorMessage ? <div className="inline-message">{generatorMessage}</div> : null}
        {generatorError ? <div className="inline-message inline-message--error">{generatorError}</div> : null}

        {drafts.length > 0 ? (
          <div className="builder-draft-list">
            {drafts.map((draft, index) => (
              <div key={`${draft.interactionType}-${index}`} className="builder-draft-card">
                <div className="builder-draft-card__top">
                  <div>
                    <strong>{draft.title}</strong>
                    <p>{draft.prompt}</p>
                  </div>
                  <div className="builder-draft-card__badges">
                    <Badge>{INTERACTION_LABELS[draft.interactionType]}</Badge>
                    <Badge>{INPUT_TYPE_LABELS[draft.inputType]}</Badge>
                    <Badge>{VISIBILITY_LABELS[draft.visibility]}</Badge>
                  </div>
                </div>
                {draft.choices.length > 0 ? (
                  <div className="builder-draft-card__choices">
                    {draft.choices.map((choice) => (
                      <span key={choice} className="library-template-tag">
                        {choice}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
