import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FileUp, Save } from 'lucide-react';
import { TeacherGate } from '../components/teacher/TeacherGate';
import { usePresenterAuth } from '../auth/AuthProvider';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { InteractionEditorCard } from '../components/builder/InteractionEditorCard';
import { PptxExtractModal } from '../components/builder/PptxExtractModal';
import {
  DEFAULT_GENERATOR_OPTIONS,
  EMPTY_TEMPLATE,
  SHAREABLE_VISIBILITY_LABELS,
  createEditableInteraction,
  createEditableSlide,
  formatToolTags,
  getNextSortOrder,
  parseToolTags,
  sortInteractions,
  sortSlides,
  swapInteractionOrder,
  type EditableInteraction,
  type EditableSlide,
  type GeneratorOptionsState,
  type TemplateFormState,
} from '../components/builder/builderModel';
import { INTERACTION_LABELS, createEmptyInteractionSeed } from '../data/lessonTemplatePresets';
import {
  createLessonTemplate,
  saveLessonInteractions,
  saveLessonSlides,
  updateLessonTemplate,
} from '../firebase/lessonTemplates';
import type { TemplateVisibility } from '../firebase/types';
import { useLessonTemplateDetail } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';
import {
  generateInteractionsFromSlides,
  type GeneratedInteractionDraft,
} from '../utils/interactionGenerator';
import { extractSlidesFromPptx } from '../utils/pptx';

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

    if (!title) {
      setSaveError('템플릿 제목을 입력해주세요.');
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
          <Button
            disabled={busy || sortedInteractions.length === 0}
            size="sm"
            onClick={() => void handleSave()}
          >
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

        <Input
          label="템플릿 제목"
          placeholder="예: AI 이미지 생성 실습"
          value={form.title}
          onChange={(event) => handleFormPatch({ title: event.target.value })}
        />

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

        <details className="builder-optional-meta">
          <summary>추가 정보 (선택)</summary>

          <div className="builder-meta-grid">
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
        </details>
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
