import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ListChecks, Save, Sparkles } from 'lucide-react';
import { usePresenterAuth } from '../auth/AuthProvider';
import { BackLink } from '../components/common/BackLink';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import '../styles/survey-builder.css';
import '../styles/template-builder.css';
// 질문 편집 카드는 설문 만들기 화면과 동일한 소스를 공유한다(한 곳만 고치면 양쪽 반영).
import { QuestionEditor } from '../components/session/QuestionEditor';
import {
  createDraft,
  draftChoiceTexts,
  swapDrafts,
  toChoiceDrafts,
  type CustomQuestionDraft,
} from '../components/session/customQuestionDraft';
import {
  EMPTY_TEMPLATE,
  SHAREABLE_VISIBILITY_LABELS,
  createEditableSlide,
  formatToolTags,
  parseToolTags,
  sortSlides,
  type EditableSlide,
  type TemplateFormState,
} from '../components/builder/builderModel';
import {
  createLessonTemplate,
  saveLessonInteractions,
  saveLessonSlides,
  updateLessonTemplate,
} from '../firebase/lessonTemplates';
import { inferInteractionType, inferPurpose } from '../firebase/sessions';
import { STARTUP_BOOTCAMP_TEMPLATE } from '../data/startupBootcampTemplate';
import type { QuestionInputType, TemplateVisibility } from '../firebase/types';
import { useLessonTemplateDetail } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';

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
  const [questions, setQuestions] = useState<CustomQuestionDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // 모바일(≤960px)에서 좌/우 패널을 탭으로 전환한다.
  const [activePane, setActivePane] = useState<'meta' | 'questions'>('questions');

  useEffect(() => {
    if (!templateId) {
      if (hydratedTemplateRef.current !== '__new__') {
        hydratedTemplateRef.current = '__new__';
        setForm(EMPTY_TEMPLATE);
        setSlides([]);
        setQuestions([]);
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
    setQuestions(
      [...loadedInteractions]
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        .map((interaction) =>
          createDraft({
            phase: interaction.phase,
            title: interaction.title,
            prompt: interaction.prompt,
            inputType: interaction.inputType,
            visibility: interaction.visibility,
            choices: toChoiceDrafts(interaction.choices ?? []),
            maxLength: interaction.maxLength ?? 300,
          }),
        ),
    );
  }, [template, templateId, loadedSlides, loadedInteractions]);

  const sortedSlides = useMemo(() => sortSlides(slides), [slides]);

  const handleFormPatch = (patch: Partial<TemplateFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleAddQuestion = (inputType: QuestionInputType) => {
    setQuestions((current) => [...current, createDraft({ inputType, visibility: 'public' })]);
  };

  // 창업 부트캠프 전체 공유 프리셋을 폼과 질문 목록에 채운다(새 템플릿에서만 노출).
  // 공유 권한이 없으면 개인용으로 떨어뜨린다(저장 시에도 동일하게 강제됨).
  const handleLoadStartupPreset = () => {
    setForm({
      title: STARTUP_BOOTCAMP_TEMPLATE.title,
      description: STARTUP_BOOTCAMP_TEMPLATE.description,
      subject: STARTUP_BOOTCAMP_TEMPLATE.subject,
      targetGrade: STARTUP_BOOTCAMP_TEMPLATE.targetGrade,
      toolInput: formatToolTags(STARTUP_BOOTCAMP_TEMPLATE.toolTags),
      templateVisibility: canShareTemplate ? STARTUP_BOOTCAMP_TEMPLATE.templateVisibility : 'private',
    });
    setQuestions(
      STARTUP_BOOTCAMP_TEMPLATE.interactions.map((seed) =>
        createDraft({
          phase: seed.phase,
          title: seed.title,
          prompt: seed.prompt,
          inputType: seed.inputType,
          visibility: seed.visibility,
          choices: toChoiceDrafts(seed.choices),
          maxLength: seed.maxLength,
        }),
      ),
    );
  };

  const handleQuestionPatch = (clientId: string, patch: Partial<CustomQuestionDraft>) => {
    setQuestions((current) =>
      current.map((question) => (question.clientId === clientId ? { ...question, ...patch } : question)),
    );
  };

  const handleQuestionDelete = (clientId: string) => {
    setQuestions((current) => current.filter((question) => question.clientId !== clientId));
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const subject = form.subject.trim();

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
          interactionCount: questions.length,
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
          interactionCount: questions.length,
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
          questions.map((question, index) => ({
            order: index + 1,
            phase: question.phase,
            interactionType: inferInteractionType(question.phase, question.inputType),
            purpose: inferPurpose(question.phase, question.inputType),
            inputType: question.inputType,
            visibility: question.visibility,
            title: question.title.trim() || `질문 ${index + 1}`,
            prompt: question.prompt.trim(),
            choices: draftChoiceTexts(question.choices),
            maxLength: question.maxLength,
            presenterNote: '',
            timingLabel: '',
            schemaVersion: 2,
          })),
        ),
      ]);

      setSaveMessage('템플릿을 저장했습니다.');
      // 저장 후 설문지 템플릿으로 이동하고 방금 저장한 템플릿을 선택한다.
      navigate(`/templates?selected=${currentTemplateId}`);
    } catch (saveErr) {
      setSaveError(saveErr instanceof Error ? saveErr.message : '템플릿 저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (templateId && loading) {
    return null;
  }

  if (templateId && error) {
    return (
      <main className="templateBuilderPage">
        <Card className="banner-card banner-card--error">
          <h3>템플릿을 열 수 없습니다.</h3>
          <p>{error}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="templateBuilderPage">
      <div className="templateBuilderShell">
        <header className="templateBuilderToolbar">
          <div className="templateBuilderTitleBlock">
            <BackLink to="/templates" label="설문지 템플릿" />
            <h1>{templateId ? '설문지 템플릿 편집' : '새 설문지 템플릿'}</h1>
          </div>
          <div className="templateBuilderActions">
            {!templateId ? (
              <Button size="sm" variant="secondary" onClick={handleLoadStartupPreset}>
                <Sparkles size={16} />
                창업 부트캠프 불러오기
              </Button>
            ) : null}
            <Button
              disabled={busy || !form.title.trim() || questions.length === 0}
              size="sm"
              onClick={() => void handleSave()}
            >
              <Save size={16} />
              저장
            </Button>
          </div>
        </header>

        <div className="mobilePaneTabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activePane === 'meta'}
            className={`mobilePaneTab ${activePane === 'meta' ? 'isActive' : ''}`}
            onClick={() => setActivePane('meta')}
          >
            <FileText size={15} />
            템플릿 정보
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activePane === 'questions'}
            className={`mobilePaneTab ${activePane === 'questions' ? 'isActive' : ''}`}
            onClick={() => setActivePane('questions')}
          >
            <ListChecks size={15} />
            질문 목록
          </button>
        </div>

        <section className="templateBuilderWorkspace" data-active-pane={activePane}>
          <aside className="templateMetaPanel">
            <header className="builderPaneHeader">
              <FileText size={18} />
              <h2>템플릿 정보</h2>
            </header>

            <div className="templateMetaScroll">
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

              <label className="field">
                <span className="field__label">설명 (선택)</span>
                <textarea
                  className="textarea templateMetaDescription"
                  placeholder="수업 목표와 진행 포인트를 적어주세요."
                  value={form.description}
                  onChange={(event) => handleFormPatch({ description: event.target.value })}
                />
              </label>

              <Input
                label="과목 유형 (선택)"
                placeholder="예: 인공지능, 로봇, 피지컬 컴퓨팅"
                value={form.subject}
                onChange={(event) => handleFormPatch({ subject: event.target.value })}
              />
              <Input
                label="대상 학년 (선택)"
                placeholder="예: 초5-중1"
                value={form.targetGrade}
                onChange={(event) => handleFormPatch({ targetGrade: event.target.value })}
              />
              <Input
                label="사용 툴 (선택)"
                placeholder="예: Canva, Scratch, ChatGPT"
                value={form.toolInput}
                onChange={(event) => handleFormPatch({ toolInput: event.target.value })}
              />

              {saveMessage ? <div className="inline-message">{saveMessage}</div> : null}
              {saveError ? <div className="inline-message inline-message--error">{saveError}</div> : null}
            </div>
          </aside>

          <section className="questionBuilderPanel">
            <header className="questionBuilderHeader">
              <div className="builderPaneHeader">
                <ListChecks size={18} />
                <h2>질문 목록</h2>
              </div>
              <div className="questionAddActions">
                <Button size="sm" variant="secondary" onClick={() => handleAddQuestion('choice')}>
                  + 객관식
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleAddQuestion('text')}>
                  + 주관식
                </Button>
              </div>
            </header>

            <div className="questionBuilderScroll">
              {questions.length === 0 ? (
                <div className="emptyQuestionState">
                  <p className="emptyQuestionTitle">아직 질문이 없습니다</p>
                  <p className="emptyQuestionText">
                    객관식, 주관식 질문을 추가해 설문을 구성하세요.
                  </p>
                </div>
              ) : (
                <div className="questionList">
                  {questions.map((question, index) => (
                    <QuestionEditor
                      key={question.clientId}
                      canDelete
                      draft={question}
                      index={index}
                      onDelete={handleQuestionDelete}
                      onMove={(clientId, direction) =>
                        setQuestions((current) => swapDrafts(current, clientId, direction))
                      }
                      onPatch={handleQuestionPatch}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

export function LessonTemplateBuilderPage() {
  const { user } = usePresenterAuth();
  if (!user) {
    return null;
  }
  return <LessonTemplateBuilderContent ownerUid={user.uid} />;
}
