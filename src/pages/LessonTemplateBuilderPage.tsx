import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { ArrowDown, ArrowUp, CopyPlus, FileUp, Save, Sparkles, Trash2 } from 'lucide-react';
import { TeacherGate } from '../components/teacher/TeacherGate';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import {
  DORO_INTERACTION_PRESETS,
  INPUT_TYPE_LABELS,
  INTERACTION_LABELS,
  PHASE_COLORS,
  PHASE_DESCRIPTIONS,
  PHASE_LABELS,
  PHASE_ORDER,
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
import { signOutUser } from '../firebase/auth';
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
  subject: '기술 수업',
  targetGrade: '',
  toolInput: '',
  templateVisibility: 'private',
};

const TEMPLATE_VISIBILITY_LABELS: Record<TemplateVisibility, string> = {
  private: '개인용',
  org: '조직 공유',
  shared: '전체 공유',
};

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

function sortInteractions(items: EditableInteraction[]) {
  return [...items].sort((left, right) => {
    const phaseGap = PHASE_ORDER.indexOf(left.phase) - PHASE_ORDER.indexOf(right.phase);
    if (phaseGap !== 0) return phaseGap;
    return left.sortOrder - right.sortOrder;
  });
}

function sortSlides(items: EditableSlide[]) {
  return [...items].sort((left, right) => left.slideNumber - right.slideNumber);
}

function getNextSortOrder(items: EditableInteraction[], phase: LessonPhase) {
  const maxOrder = items
    .filter((item) => item.phase === phase)
    .reduce((max, item) => Math.max(max, item.sortOrder), 0);

  return maxOrder + 1;
}

function swapInteractionOrder(items: EditableInteraction[], clientId: string, direction: -1 | 1) {
  const target = items.find((item) => item.clientId === clientId);
  if (!target) return items;

  const siblings = items
    .filter((item) => item.phase === target.phase)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const index = siblings.findIndex((item) => item.clientId === clientId);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= siblings.length) {
    return items;
  }

  const current = siblings[index];
  const adjacent = siblings[nextIndex];

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

function PhaseTag({ phase }: { phase: LessonPhase }) {
  return (
    <span
      className="phase-tag"
      style={{ '--phase-color': PHASE_COLORS[phase] } as React.CSSProperties}
    >
      {PHASE_LABELS[phase]}
    </span>
  );
}

type PhaseSectionProps = {
  phase: LessonPhase;
  slides: EditableSlide[];
  interactions: EditableInteraction[];
  onSlidePhaseChange: (clientId: string, phase: LessonPhase) => void;
  onInteractionAdd: (phase: LessonPhase) => void;
  onInteractionDelete: (clientId: string) => void;
  onInteractionMove: (clientId: string, direction: -1 | 1) => void;
  onInteractionPatch: (clientId: string, patch: Partial<EditableInteraction>) => void;
};

function PhaseSection({
  phase,
  slides,
  interactions,
  onSlidePhaseChange,
  onInteractionAdd,
  onInteractionDelete,
  onInteractionMove,
  onInteractionPatch,
}: PhaseSectionProps) {
  const orderedInteractions = [...interactions].sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <Card className="builder-phase-card">
      <div className="builder-phase-card__header">
        <div className="builder-phase-card__heading">
          <PhaseTag phase={phase} />
          <div>
            <h3>{PHASE_LABELS[phase]}</h3>
            <p>{PHASE_DESCRIPTIONS[phase]}</p>
          </div>
        </div>
        <div className="builder-phase-card__meta">
          <Badge>{slides.length} slides</Badge>
          <Badge>{orderedInteractions.length} interactions</Badge>
        </div>
      </div>

      <div className="builder-phase-card__content">
        <div className="builder-phase-card__column">
          <div className="builder-phase-card__column-head">
            <strong>Slides</strong>
            <span>{slides.length === 0 ? '배정된 슬라이드 없음' : 'PPTX 기반 분류 결과'}</span>
          </div>
          <div className="builder-slide-list">
            {slides.length === 0 ? (
              <div className="builder-empty-state">
                <p>이 phase에 배정된 슬라이드가 없습니다.</p>
              </div>
            ) : (
              slides.map((slide) => (
                <div key={slide.clientId} className="builder-slide-card">
                  <div className="builder-slide-card__header">
                    <strong>{slide.title || `슬라이드 ${slide.slideNumber}`}</strong>
                    <Badge tone={slide.phase === slide.detectedPhase ? 'success' : 'accent'}>
                      AI {slide.detectedPhase === slide.phase ? '확정' : '제안'}
                    </Badge>
                  </div>
                  <p className="builder-slide-card__text">
                    {slide.content || slide.rawTexts.join(' ').slice(0, 180) || '텍스트가 거의 없는 슬라이드입니다.'}
                  </p>
                  <div className="builder-slide-card__footer">
                    <span>#{slide.slideNumber} · AI 분류 {PHASE_LABELS[slide.detectedPhase]} · 신뢰도 {Math.round(slide.phaseConfidence * 100)}%</span>
                    <select
                      className="select-sm"
                      value={slide.phase}
                      onChange={(event) => onSlidePhaseChange(slide.clientId, event.target.value as LessonPhase)}
                    >
                      {PHASE_ORDER.map((optionPhase) => (
                        <option key={optionPhase} value={optionPhase}>
                          {PHASE_LABELS[optionPhase]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="builder-phase-card__column">
          <div className="builder-phase-card__column-head">
            <strong>Interaction Blocks</strong>
            <Button size="sm" variant="secondary" onClick={() => onInteractionAdd(phase)}>
              + Interaction
            </Button>
          </div>

          <div className="builder-interaction-list">
            {orderedInteractions.length === 0 ? (
              <div className="builder-empty-state">
                <p>아직 interaction block이 없습니다. 아래 기본 버튼 또는 + Interaction으로 추가하세요.</p>
              </div>
            ) : (
              orderedInteractions.map((interaction, index) => (
                <div key={interaction.clientId} className="builder-interaction-card">
                  <div className="builder-interaction-card__header">
                    <div className="builder-interaction-card__title-row">
                      <span className="builder-interaction-card__index">
                        {PHASE_LABELS[phase]} {index + 1}
                      </span>
                      <Input
                        aria-label={`${PHASE_LABELS[phase]} interaction title`}
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
                      <span className="form-label">Phase</span>
                      <select
                        className="select-sm"
                        value={interaction.phase}
                        onChange={(event) =>
                          onInteractionPatch(interaction.clientId, { phase: event.target.value as LessonPhase })
                        }
                      >
                        {PHASE_ORDER.map((optionPhase) => (
                          <option key={optionPhase} value={optionPhase}>
                            {PHASE_LABELS[optionPhase]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span className="form-label">Interaction type</span>
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
                      <span className="form-label">Purpose</span>
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
                      <span className="form-label">Result visibility</span>
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
                      <span className="form-label">Input type</span>
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
                      label="Timing label"
                      value={interaction.timingLabel ?? ''}
                      placeholder="예: 3분"
                      onChange={(event) =>
                        onInteractionPatch(interaction.clientId, { timingLabel: event.target.value })
                      }
                    />
                  </div>

                  <label className="form-field">
                    <span className="form-label">Prompt</span>
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
                      <span className="form-label">Choices</span>
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
                      <span className="form-label">Presenter note</span>
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
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function GeneratedDraftPreview({
  drafts,
  onApply,
  onClear,
}: {
  drafts: GeneratedInteractionDraft[];
  onApply: () => void;
  onClear: () => void;
}) {
  const groupedDrafts = PHASE_ORDER.map((phase) => ({
    phase,
    items: drafts.filter((draft) => draft.phase === phase),
  })).filter((group) => group.items.length > 0);

  if (drafts.length === 0) {
    return null;
  }

  return (
    <Card className="builder-generator-card">
      <div className="builder-section-head">
        <div>
          <h3>interaction 초안 미리보기</h3>
          <p>이 초안은 아직 Firestore에 저장되지 않았습니다. 반영 후 아래 편집 화면에서 자유롭게 수정할 수 있습니다.</p>
        </div>
        <div className="builder-toolbar__actions">
          <Button size="sm" variant="ghost" onClick={onClear}>
            초안 지우기
          </Button>
          <Button size="sm" onClick={onApply}>
            초안 전체 반영
          </Button>
        </div>
      </div>

      <div className="builder-draft-phase-list">
        {groupedDrafts.map((group) => (
          <div key={group.phase} className="builder-draft-phase-card">
            <div className="builder-draft-phase-card__header">
              <div className="builder-phase-card__heading">
                <PhaseTag phase={group.phase} />
                <strong>{PHASE_LABELS[group.phase]}</strong>
              </div>
              <Badge>{group.items.length} drafts</Badge>
            </div>

            <div className="builder-draft-list">
              {group.items.map((draft, index) => (
                <div key={`${group.phase}-${draft.interactionType}-${index}`} className="builder-draft-card">
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

                  <div className="builder-draft-card__meta">
                    <span>slides #{draft.sourceSlideNumbers.join(', ')}</span>
                    <span>{draft.generatorReason}</span>
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
          </div>
        ))}
      </div>
    </Card>
  );
}

function LessonTemplateBuilderContent({ ownerUid }: { ownerUid: string }) {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { profile } = useUserProfile(ownerUid);
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

  const addInteraction = (phase: LessonPhase, seed?: InteractionSeed) => {
    setInteractions((current) => [
      ...current,
      createEditableInteraction(seed ?? createEmptyInteractionSeed(phase), getNextSortOrder(current, phase)),
    ]);
  };

  const handlePresetAdd = (presetId: string) => {
    const preset = DORO_INTERACTION_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    addInteraction(preset.seed.phase, preset.seed);
  };

  const handleInteractionPatch = (clientId: string, patch: Partial<EditableInteraction>) => {
    setInteractions((current) =>
      current.map((interaction) => {
        if (interaction.clientId !== clientId) return interaction;

        if (patch.phase && patch.phase !== interaction.phase) {
          const { clientId: _clientId, sortOrder: _sortOrder, ...restPatch } = patch;
          return {
            ...interaction,
            ...restPatch,
            phase: patch.phase,
            sortOrder: getNextSortOrder(current, patch.phase),
          };
        }

        return { ...interaction, ...patch };
      }),
    );
  };

  const handleInteractionDelete = (clientId: string) => {
    setInteractions((current) => current.filter((interaction) => interaction.clientId !== clientId));
  };

  const handleSlidePhaseChange = (clientId: string, phase: LessonPhase) => {
    setSlides((current) =>
      current.map((slide) => (slide.clientId === clientId ? { ...slide, phase } : slide)),
    );
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
          createEditableInteraction(draft, getNextSortOrder(next, draft.phase)),
        ];
      });

      return next;
    });

    setGeneratorMessage('초안을 interaction 목록에 반영했습니다. 저장 전에 각 질문을 수정해주세요.');
    setGeneratorError(null);
    setGeneratedDrafts([]);
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
      let currentTemplateId = templateId;

      if (!currentTemplateId) {
        currentTemplateId = await createLessonTemplate({
          ownerUid,
          organizationId: profile?.organizationId ?? 'dorossaem',
          title,
          subject,
          description: form.description,
          templateVisibility: form.templateVisibility,
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
          templateVisibility: form.templateVisibility,
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

  const overallSummary = useMemo(
    () =>
      PHASE_ORDER.map((phase) => ({
        phase,
        slideCount: sortedSlides.filter((slide) => slide.phase === phase).length,
        interactionCount: sortedInteractions.filter((interaction) => interaction.phase === phase).length,
      })),
    [sortedInteractions, sortedSlides],
  );

  if (templateId && loading) {
    return <Card className="waiting-state"><p>템플릿을 불러오는 중입니다.</p></Card>;
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
          <Badge tone="accent">{templateId ? 'Builder' : 'New Template'}</Badge>
          <h2>{templateId ? 'Lesson Template Builder' : '새 lesson template'}</h2>
          <p>수업 메타데이터, phase 구획, PPTX 슬라이드, interaction block을 한 화면에서 정리합니다.</p>
        </div>
        <div className="builder-toolbar__actions">
          <Button size="sm" variant="ghost" onClick={() => navigate('/library')}>
            라이브러리
          </Button>
          {templateId ? (
            <Link className="builder-link-button" to={`/session-new?template=${templateId}`}>
              세션 만들기
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
            <h3>수업 기본 정보</h3>
            <p>템플릿 메타데이터를 저장하면 library와 session 생성 화면에서 바로 사용할 수 있습니다.</p>
          </div>
          <Badge>{sortedInteractions.length} interactions</Badge>
        </div>

        <div className="builder-meta-grid">
          <Input
            label="Lesson template 제목"
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

        <label className="form-field">
          <span className="form-label">Template visibility</span>
          <select
            className="select-sm"
            value={form.templateVisibility}
            onChange={(event) =>
              handleFormPatch({ templateVisibility: event.target.value as TemplateVisibility })
            }
          >
            {(Object.entries(TEMPLATE_VISIBILITY_LABELS) as [TemplateVisibility, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <Card className="builder-upload-card">
        <div className="builder-section-head">
          <div>
            <h3>PPTX 기반 phase 분류</h3>
            <p>원본 PPTX는 브라우저에서만 읽고 저장하지 않습니다. 추출된 슬라이드 메타데이터만 템플릿에 반영됩니다.</p>
          </div>
          <Badge tone={sourceFileName ? 'success' : 'default'}>
            {sourceFileName ?? 'PPTX not loaded'}
          </Badge>
        </div>

        <div className="builder-upload-card__body">
          <label className="builder-upload-dropzone">
            <input
              accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              className="builder-upload-dropzone__input"
              type="file"
              onChange={(event) => {
                void handlePptxUpload(event);
              }}
            />
            <FileUp size={20} />
            <strong>{uploadingPptx ? 'PPTX 분석 중...' : 'PPTX 업로드'}</strong>
            <span>슬라이드 텍스트를 읽어 도입/이론/실습/윤리/마무리 phase를 자동 제안합니다.</span>
          </label>

          <div className="builder-summary-grid">
            {overallSummary.map((summary) => (
              <div key={summary.phase} className="builder-summary-tile">
                <PhaseTag phase={summary.phase} />
                <strong>{summary.slideCount} slides</strong>
                <span>{summary.interactionCount} interactions</span>
              </div>
            ))}
          </div>
        </div>

        {pptxError ? <div className="inline-message inline-message--error">{pptxError}</div> : null}

        {sortedSlides.length > 0 ? (
          <div className="builder-slide-overview">
            {sortedSlides.map((slide) => (
              <div key={slide.clientId} className="builder-slide-overview__item">
                <div>
                  <strong>#{slide.slideNumber}</strong>
                  <p>{slide.title || '제목 없음'}</p>
                </div>
                <div className="builder-slide-overview__meta">
                  <PhaseTag phase={slide.phase} />
                  <span>{Math.round(slide.phaseConfidence * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Card className="builder-preset-card">
        <div className="builder-section-head">
          <div>
            <h3>interaction 초안 만들기</h3>
            <p>외부 AI 없이 슬라이드 phase와 subject/audience/density 규칙으로 초안을 생성합니다.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleGenerateDrafts}>
            <Sparkles size={16} />
            interaction 초안 만들기
          </Button>
        </div>

        <div className="builder-generator-grid">
          <label className="form-field">
            <span className="form-label">Subject type</span>
            <select
              className="select-sm"
              value={generatorOptions.subjectType}
              onChange={(event) =>
                handleGeneratorOptionPatch({
                  subjectType: event.target.value as InteractionGeneratorSubjectType,
                })
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
            <span className="form-label">Audience level</span>
            <select
              className="select-sm"
              value={generatorOptions.audienceLevel}
              onChange={(event) =>
                handleGeneratorOptionPatch({
                  audienceLevel: event.target.value as InteractionGeneratorAudienceLevel,
                })
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
            <span className="form-label">Density</span>
            <select
              className="select-sm"
              value={generatorOptions.density}
              onChange={(event) =>
                handleGeneratorOptionPatch({
                  density: event.target.value as InteractionGeneratorDensity,
                })
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

        {generatorMessage ? <div className="inline-message">{generatorMessage}</div> : null}
        {generatorError ? <div className="inline-message inline-message--error">{generatorError}</div> : null}
      </Card>

      <GeneratedDraftPreview
        drafts={generatedDrafts}
        onApply={handleApplyGeneratedDrafts}
        onClear={() => {
          setGeneratedDrafts([]);
          setGeneratorError(null);
          setGeneratorMessage(null);
        }}
      />

      <Card className="builder-preset-card">
        <div className="builder-section-head">
          <div>
            <h3>DORO 기본 interaction block</h3>
            <p>자주 쓰는 수업 흐름 버튼으로 기본 블록을 빠르게 추가합니다.</p>
          </div>
          <Sparkles size={18} />
        </div>
        <div className="builder-preset-grid">
          {DORO_INTERACTION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className="builder-preset-button"
              type="button"
              onClick={() => handlePresetAdd(preset.id)}
            >
              <div className="builder-preset-button__head">
                <CopyPlus size={16} />
                <strong>{preset.label}</strong>
              </div>
              <span>{preset.description}</span>
              <PhaseTag phase={preset.seed.phase} />
            </button>
          ))}
        </div>
      </Card>

      <div className="builder-phase-stack">
        {PHASE_ORDER.map((phase) => (
          <PhaseSection
            key={phase}
            interactions={sortedInteractions.filter((interaction) => interaction.phase === phase)}
            phase={phase}
            slides={sortedSlides.filter((slide) => slide.phase === phase)}
            onInteractionAdd={addInteraction}
            onInteractionDelete={handleInteractionDelete}
            onInteractionMove={(clientId, direction) =>
              setInteractions((current) => swapInteractionOrder(current, clientId, direction))
            }
            onInteractionPatch={handleInteractionPatch}
            onSlidePhaseChange={handleSlidePhaseChange}
          />
        ))}
      </div>

      {saveMessage ? <div className="inline-message">{saveMessage}</div> : null}
      {saveError ? <div className="inline-message inline-message--error">{saveError}</div> : null}
    </div>
  );
}

export function LessonTemplateBuilderPage() {
  return (
    <TeacherGate
      compact
      description="기술 실습형 lesson template을 설계하고 PPTX 슬라이드 기준으로 phase를 정리합니다."
      eyebrow="DORO Builder"
      title="Lesson Template Builder"
      actions={() => (
        <div className="hero-actions">
          <Button size="sm" variant="ghost" onClick={() => { void signOutUser(); }}>
            로그아웃
          </Button>
        </div>
      )}
      loginAside={
        <Card className="banner-card">
          <h3>Builder에서 할 수 있는 일</h3>
          <ul className="flow-list flow-list--bullet">
            <li>도입, 이론, 실습, 윤리, 마무리 phase별로 수업 흐름을 설계합니다.</li>
            <li>PPTX 슬라이드 텍스트를 읽어 phase를 자동 제안합니다.</li>
            <li>실습 준비 체크, 윤리 질문, 마무리 회고까지 기본 block을 바로 추가합니다.</li>
          </ul>
        </Card>
      }
    >
      {(user) => <LessonTemplateBuilderContent ownerUid={user.uid} />}
    </TeacherGate>
  );
}
