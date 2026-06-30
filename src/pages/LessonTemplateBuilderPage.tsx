import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { ArrowDown, ArrowUp, FileUp, Save, Sparkles, Trash2 } from 'lucide-react';
import { TeacherGate } from '../components/teacher/TeacherGate';
import { usePresenterAuth } from '../auth/AuthProvider';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import {
  INPUT_TYPE_LABELS,
  INTERACTION_LABELS,
  PURPOSE_LABELS,
  VISIBILITY_LABELS,
  createEmptyInteractionSeed,
  type InteractionSeed,
} from '../data/lessonTemplatePresets';
import {
  createLessonTemplate,
  saveLessonInteractions,
  saveLessonSlides,
  updateLessonTemplate,
} from '../firebase/lessonTemplates';
import type {
  InteractionPurpose,
  InteractionType,
  LessonPhase,
  QuestionInputType,
  ResultVisibility,
  TemplateVisibility,
} from '../firebase/types';
import { useLessonTemplateDetail } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';
import {
  generateInteractionsFromSlides,
  type GeneratedInteractionDraft,
  type InteractionGeneratorAudienceLevel,
  type InteractionGeneratorDensity,
  type InteractionGeneratorSubjectType,
} from '../utils/interactionGenerator';
import { extractSlidesFromPptx } from '../utils/pptx';

type TemplateFormState = {
  title: string;
  description: string;
  subject: string;
  targetGrade: string;
  toolInput: string;
  templateVisibility: TemplateVisibility;
};

type EditableSlide = {
  clientId: string;
  slideNumber: number;
  title: string;
  content: string;
  rawTexts: string[];
  phase: LessonPhase;
  detectedPhase: LessonPhase;
  phaseConfidence: number;
};

type EditableInteraction = InteractionSeed & {
  clientId: string;
  sortOrder: number;
};

type GeneratorOptionsState = {
  subjectType: InteractionGeneratorSubjectType;
  audienceLevel: InteractionGeneratorAudienceLevel;
  density: InteractionGeneratorDensity;
};

const EMPTY_TEMPLATE: TemplateFormState = {
  title: '',
  description: '',
  subject: '',
  targetGrade: '',
  toolInput: '',
  templateVisibility: 'private',
};

// 조직 공유(org)는 제거. 강사는 개인용 고정, 매니저·관리자만 전체 공유를 선택할 수 있다.
const SHAREABLE_VISIBILITY_LABELS: [TemplateVisibility, string][] = [
  ['private', '개인용'],
  ['shared', '전체 공유'],
];

const DEFAULT_GENERATOR_OPTIONS: GeneratorOptionsState = {
  subjectType: 'mixed',
  audienceLevel: 'middle',
  density: 'medium',
};

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

function parseToolTags(input: string) {
  return input
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatToolTags(tags?: string[] | null) {
  return tags?.join(', ') ?? '';
}

function createEditableInteraction(seed: InteractionSeed, sortOrder: number): EditableInteraction {
  return {
    clientId: nanoid(),
    sortOrder,
    ...seed,
    choices: [...seed.choices],
    presenterNote: seed.presenterNote ?? '',
    timingLabel: seed.timingLabel ?? '',
  };
}

function createEditableSlide(input: {
  slideNumber: number;
  title: string;
  content: string;
  rawTexts: string[];
  phase: LessonPhase;
  detectedPhase: LessonPhase;
  phaseConfidence: number;
}): EditableSlide {
  return {
    clientId: nanoid(),
    ...input,
  };
}

// 단계(phase) 그룹핑 없이 전역 순서(sortOrder)대로 평면 정렬한다.
function sortInteractions(items: EditableInteraction[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder);
}

function sortSlides(items: EditableSlide[]) {
  return [...items].sort((left, right) => left.slideNumber - right.slideNumber);
}

function getNextSortOrder(items: EditableInteraction[]) {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
}

// 전역 평면 목록에서 인접한 질문과 순서를 맞바꾼다(phase 무관).
function swapInteractionOrder(items: EditableInteraction[], clientId: string, direction: -1 | 1) {
  const sorted = [...items].sort((left, right) => left.sortOrder - right.sortOrder);
  const index = sorted.findIndex((item) => item.clientId === clientId);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= sorted.length) {
    return items;
  }

  const current = sorted[index];
  const adjacent = sorted[nextIndex];

  return items.map((item) => {
    if (item.clientId === current.clientId) {
      return { ...item, sortOrder: adjacent.sortOrder };
    }

    if (item.clientId === adjacent.clientId) {
      return { ...item, sortOrder: current.sortOrder };
    }

    return item;
  });
}

type InteractionEditorCardProps = {
  interaction: EditableInteraction;
  index: number;
  onInteractionPatch: (clientId: string, patch: Partial<EditableInteraction>) => void;
  onInteractionDelete: (clientId: string) => void;
  onInteractionMove: (clientId: string, direction: -1 | 1) => void;
};

function InteractionEditorCard({
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
function PptxExtractModal({
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

function LessonTemplateBuilderContent({ ownerUid }: { ownerUid: string }) {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { role } = usePresenterAuth();
  const { profile } = useUserProfile(ownerUid);
  // 매니저·관리자만 템플릿을 '전체 공유'로 둘 수 있다. 강사는 항상 개인용.
  const canShareTemplate = role === 'admin' || role === 'manager' || profile?.role === 'admin';
  const { template, slides: loadedSlides, interactions: loadedInteractions, loading, error } = useLessonTemplateDetail(
    templateId,
  );
  const hydratedTemplateRef = useRef<string | null>(null);

  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE);
  const [slides, setSlides] = useState<EditableSlide[]>([]);
  const [interactions, setInteractions] = useState<EditableInteraction[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pptxError, setPptxError] = useState<string | null>(null);
  const [uploadingPptx, setUploadingPptx] = useState(false);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [generatorOptions, setGeneratorOptions] = useState<GeneratorOptionsState>(DEFAULT_GENERATOR_OPTIONS);
  const [generatedDrafts, setGeneratedDrafts] = useState<GeneratedInteractionDraft[]>([]);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [generatorMessage, setGeneratorMessage] = useState<string | null>(null);
  const [pptxModalOpen, setPptxModalOpen] = useState(false);

  useEffect(() => {
    if (!templateId) {
      if (hydratedTemplateRef.current !== '__new__') {
        hydratedTemplateRef.current = '__new__';
        setForm(EMPTY_TEMPLATE);
        setSlides([]);
        setInteractions([]);
      }
      return;
    }

    if (!template || hydratedTemplateRef.current === templateId) {
      return;
    }

    hydratedTemplateRef.current = templateId;
    setForm({
      title: template.title,
      description: template.description,
      subject: template.subject,
      targetGrade: template.targetGrade ?? '',
      toolInput: formatToolTags(template.toolTags),
      templateVisibility: template.templateVisibility ?? (template.shared ? 'org' : 'private'),
    });
    setSlides(
      sortSlides(
        loadedSlides.map((slide) =>
          createEditableSlide({
            slideNumber: slide.slideNumber ?? slide.order,
            title: slide.title,
            content: slide.content,
            rawTexts: slide.content ? [slide.content] : [],
            phase: slide.phase,
            detectedPhase: slide.detectedPhase ?? slide.phase,
            phaseConfidence: slide.phaseConfidence ?? 0.5,
          }),
        ),
      ),
    );
    setInteractions(
      sortInteractions(
        loadedInteractions.map((interaction, index) =>
          createEditableInteraction(
            {
              phase: interaction.phase,
              interactionType: interaction.interactionType,
              purpose: interaction.purpose,
              inputType: interaction.inputType,
              visibility: interaction.visibility,
              title: interaction.title,
              prompt: interaction.prompt,
              choices: interaction.choices ?? [],
              maxLength: interaction.maxLength ?? 300,
              presenterNote: interaction.presenterNote ?? '',
              timingLabel: interaction.timingLabel ?? '',
            },
            interaction.order ?? index + 1,
          ),
        ),
      ),
    );
  }, [template, templateId, loadedSlides, loadedInteractions]);

  const sortedInteractions = useMemo(() => sortInteractions(interactions), [interactions]);
  const sortedSlides = useMemo(() => sortSlides(slides), [slides]);

  useEffect(() => {
    setGeneratedDrafts([]);
    setGeneratorError(null);
    setGeneratorMessage(null);
  }, [slides]);

  const handleFormPatch = (patch: Partial<TemplateFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  // 평면 질문 목록에 빈 질문을 추가한다. phase는 데이터 호환용 기본값('intro').
  const handleAddQuestion = () => {
    setInteractions((current) => [
      ...current,
      createEditableInteraction(createEmptyInteractionSeed('intro'), getNextSortOrder(current)),
    ]);
  };

  const handleInteractionPatch = (clientId: string, patch: Partial<EditableInteraction>) => {
    setInteractions((current) =>
      current.map((interaction) =>
        interaction.clientId === clientId ? { ...interaction, ...patch } : interaction,
      ),
    );
  };

  const handleInteractionDelete = (clientId: string) => {
    setInteractions((current) => current.filter((interaction) => interaction.clientId !== clientId));
  };

  const handleGeneratorOptionPatch = (patch: Partial<GeneratorOptionsState>) => {
    setGeneratorOptions((current) => ({ ...current, ...patch }));
  };

  const handleGenerateDrafts = () => {
    if (sortedSlides.length === 0) {
      setGeneratorError('interaction 초안을 만들려면 먼저 PPTX를 올리거나 슬라이드를 준비해주세요.');
      setGeneratorMessage(null);
      setGeneratedDrafts([]);
      return;
    }

    const drafts = generateInteractionsFromSlides(
      sortedSlides.map((slide) => ({
        slideNumber: slide.slideNumber,
        title: slide.title,
        text: slide.content,
        rawTexts: slide.rawTexts,
        phase: slide.phase,
        detectedPhase: slide.detectedPhase,
      })),
      generatorOptions,
    );

    if (drafts.length === 0) {
      setGeneratorError('현재 슬라이드 구조로는 생성할 초안이 없습니다. phase 배정을 먼저 확인해주세요.');
      setGeneratorMessage(null);
      setGeneratedDrafts([]);
      return;
    }

    setGeneratorError(null);
    setGeneratorMessage(`규칙 기반 interaction 초안 ${drafts.length}개를 생성했습니다.`);
    setGeneratedDrafts(drafts);
  };

  const handleApplyGeneratedDrafts = () => {
    if (generatedDrafts.length === 0) return;

    setInteractions((current) => {
      let next = [...current];

      generatedDrafts.forEach((draft) => {
        next = [
          ...next,
          createEditableInteraction(draft, getNextSortOrder(next)),
        ];
      });

      return next;
    });

    setGeneratorMessage('초안을 질문 목록에 반영했습니다. 저장 전에 각 질문을 수정해주세요.');
    setGeneratorError(null);
    setGeneratedDrafts([]);
    setPptxModalOpen(false);
  };

  const handlePptxUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPptx(true);
      setPptxError(null);
      const extractedSlides = await extractSlidesFromPptx(file);
      setSlides(
        extractedSlides.map((slide) =>
          createEditableSlide({
            slideNumber: slide.slideNumber,
            title: slide.title,
            content: slide.text,
            rawTexts: slide.rawTexts,
            phase: slide.detectedPhase,
            detectedPhase: slide.detectedPhase,
            phaseConfidence: slide.phaseConfidence,
          }),
        ),
      );
      setSourceFileName(file.name);
    } catch (error) {
      setPptxError(
        error instanceof Error
          ? error.message
          : 'PPTX를 분석하는 중 오류가 발생했습니다. 다른 파일로 다시 시도해주세요.',
      );
    } finally {
      event.target.value = '';
      setUploadingPptx(false);
    }
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const subject = form.subject.trim();

    if (!title || !subject) {
      setSaveError('템플릿 제목과 과목 유형을 입력해주세요.');
      return;
    }

    if (sortedInteractions.length === 0) {
      setSaveError('최소 하나의 interaction block이 필요합니다.');
      return;
    }

    try {
      setBusy(true);
      setSaveError(null);
      setSaveMessage(null);

      const toolTags = parseToolTags(form.toolInput);
      // org 제거 + 강사는 개인용 강제. 공유 권한이 있고 전체 공유를 고른 경우만 shared.
      const resolvedVisibility: TemplateVisibility =
        canShareTemplate && form.templateVisibility === 'shared' ? 'shared' : 'private';
      let currentTemplateId = templateId;

      if (!currentTemplateId) {
        currentTemplateId = await createLessonTemplate({
          ownerUid,
          organizationId: profile?.organizationId ?? 'dorossaem',
          title,
          subject,
          description: form.description,
          templateVisibility: resolvedVisibility,
          targetGrade: form.targetGrade,
          toolTags,
          slideCount: sortedSlides.length,
          interactionCount: sortedInteractions.length,
        });
      } else {
        await updateLessonTemplate(currentTemplateId, {
          title,
          subject,
          description: form.description,
          templateVisibility: resolvedVisibility,
          targetGrade: form.targetGrade,
          organizationId: profile?.organizationId ?? 'dorossaem',
          toolTags,
          slideCount: sortedSlides.length,
          interactionCount: sortedInteractions.length,
        });
      }

      await Promise.all([
        saveLessonSlides(
          currentTemplateId,
          sortedSlides.map((slide, index) => ({
            order: index + 1,
            phase: slide.phase,
            title: slide.title || `슬라이드 ${slide.slideNumber}`,
            content: slide.content,
            slideNumber: slide.slideNumber,
            detectedPhase: slide.detectedPhase,
            phaseConfidence: slide.phaseConfidence,
          })),
        ),
        saveLessonInteractions(
          currentTemplateId,
          sortedInteractions.map((interaction, index) => ({
            order: index + 1,
            phase: interaction.phase,
            interactionType: interaction.interactionType,
            purpose: interaction.purpose,
            inputType: interaction.inputType,
            visibility: interaction.visibility,
            title: interaction.title.trim() || `${INTERACTION_LABELS[interaction.interactionType]} ${index + 1}`,
            prompt: interaction.prompt.trim(),
            choices: interaction.choices.map((choice) => choice.trim()).filter(Boolean),
            maxLength: interaction.maxLength,
            presenterNote: interaction.presenterNote?.trim() || '',
            timingLabel: interaction.timingLabel?.trim() || '',
            schemaVersion: 2,
          })),
        ),
      ]);

      setSaveMessage('템플릿을 저장했습니다.');

      if (!templateId) {
        navigate(`/builder/${currentTemplateId}`, { replace: true });
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '템플릿 저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (templateId && loading) {
    return null;
  }

  if (templateId && error) {
    return (
      <Card className="banner-card banner-card--error">
        <h3>템플릿을 열 수 없습니다.</h3>
        <p>{error}</p>
      </Card>
    );
  }

  return (
    <div className="builder-page">
      <div className="builder-toolbar">
        <div className="builder-toolbar__copy">
          <h2>{templateId ? '설문지 템플릿 편집' : '새 설문지 템플릿'}</h2>
        </div>
        <div className="builder-toolbar__actions">
          {templateId ? (
            <Link className="builder-link-button" to={`/session-new?template=${templateId}`}>
              세션 열기
            </Link>
          ) : null}
          <Button disabled={busy} size="sm" onClick={() => void handleSave()}>
            <Save size={16} />
            {busy ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <Card className="builder-meta-card">
        <div className="builder-section-head">
          <div>
            <h3>기본 정보</h3>
          </div>
        </div>

        <div className="builder-meta-grid">
          <Input
            label="템플릿 제목"
            placeholder="예: AI 이미지 생성 실습"
            value={form.title}
            onChange={(event) => handleFormPatch({ title: event.target.value })}
          />
          <Input
            label="과목 유형"
            placeholder="예: 인공지능, 로봇, 피지컬 컴퓨팅"
            value={form.subject}
            onChange={(event) => handleFormPatch({ subject: event.target.value })}
          />
          <Input
            label="대상 학년"
            placeholder="예: 초5-중1"
            value={form.targetGrade}
            onChange={(event) => handleFormPatch({ targetGrade: event.target.value })}
          />
          <Input
            label="사용 툴"
            placeholder="예: Canva, Scratch, ChatGPT"
            value={form.toolInput}
            onChange={(event) => handleFormPatch({ toolInput: event.target.value })}
          />
        </div>

        <label className="form-field">
          <span className="form-label">설명</span>
          <textarea
            className="textarea"
            rows={3}
            placeholder="수업 목표와 진행 포인트를 적어주세요."
            value={form.description}
            onChange={(event) => handleFormPatch({ description: event.target.value })}
          />
        </label>

        {canShareTemplate ? (
          <label className="form-field">
            <span className="form-label">공개 범위</span>
            <select
              className="select-sm"
              value={form.templateVisibility === 'shared' ? 'shared' : 'private'}
              onChange={(event) =>
                handleFormPatch({ templateVisibility: event.target.value as TemplateVisibility })
              }
            >
              {SHAREABLE_VISIBILITY_LABELS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </Card>

      <Card className="builder-meta-card">
        <div className="builder-section-head">
          <div>
            <h3>질문 목록</h3>
          </div>
          <div className="builder-toolbar__actions">
            <Button size="sm" variant="secondary" onClick={() => setPptxModalOpen(true)}>
              <FileUp size={16} />
              PPTX에서 추출하기
            </Button>
            <Button size="sm" onClick={handleAddQuestion}>
              + 질문 추가
            </Button>
          </div>
        </div>

        <div className="builder-interaction-list">
          {sortedInteractions.length === 0 ? (
            <div className="builder-empty-state">
              <p>아직 질문이 없습니다. '+ 질문 추가'로 직접 만들거나 'PPTX에서 추출하기'로 불러오세요.</p>
            </div>
          ) : (
            sortedInteractions.map((interaction, index) => (
              <InteractionEditorCard
                key={interaction.clientId}
                index={index}
                interaction={interaction}
                onInteractionPatch={handleInteractionPatch}
                onInteractionDelete={handleInteractionDelete}
                onInteractionMove={(clientId, direction) =>
                  setInteractions((current) => swapInteractionOrder(current, clientId, direction))
                }
              />
            ))
          )}
        </div>
      </Card>

      {saveMessage ? <div className="inline-message">{saveMessage}</div> : null}
      {saveError ? <div className="inline-message inline-message--error">{saveError}</div> : null}

      <PptxExtractModal
        open={pptxModalOpen}
        onClose={() => setPptxModalOpen(false)}
        uploadingPptx={uploadingPptx}
        sourceFileName={sourceFileName}
        slideCount={sortedSlides.length}
        pptxError={pptxError}
        onUpload={(event) => {
          void handlePptxUpload(event);
        }}
        generatorOptions={generatorOptions}
        onOptionPatch={handleGeneratorOptionPatch}
        onGenerate={handleGenerateDrafts}
        drafts={generatedDrafts}
        generatorError={generatorError}
        generatorMessage={generatorMessage}
        onApply={handleApplyGeneratedDrafts}
      />
    </div>
  );
}

export function LessonTemplateBuilderPage() {
  return (
    <TeacherGate
      compact
      loginAside={
        <Card className="banner-card">
          <h3>템플릿을 만드는 경우</h3>
          <ul className="flow-list flow-list--bullet">
            <li>도입, 이론, 실습, 윤리, 마무리 구간별로 질문을 배치합니다.</li>
            <li>PPTX 슬라이드 텍스트를 읽어 수업 구간을 제안합니다.</li>
            <li>실습 준비 체크, 윤리 질문, 마무리 회고를 기본 블록으로 추가합니다.</li>
          </ul>
        </Card>
      }
    >
      {(user) => <LessonTemplateBuilderContent ownerUid={user.uid} />}
    </TeacherGate>
  );
}
