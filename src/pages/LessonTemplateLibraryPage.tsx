import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookCopy,
  BookOpen,
  CopyPlus,
  FileText,
  FolderKanban,
  Globe,
  GraduationCap,
  LayoutTemplate,
  List,
  PencilLine,
  User,
} from 'lucide-react';
import { usePresenterAuth } from '../auth/AuthProvider';
import { duplicateLessonTemplate } from '../firebase/lessonTemplates';
import { useLessonTemplateDetail, useLessonTemplateLibrary } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';
import type {
  LessonInteractionDoc,
  LessonTemplateDoc,
  QuestionInputType,
  ResultVisibility,
} from '../firebase/types';
import '../styles/survey-builder.css';
import '../styles/template-builder.css';

const QUESTION_TYPE_LABELS: Record<QuestionInputType, string> = {
  choice: '객관식',
  multi: '복수 선택',
  text: '주관식',
  scale: '척도',
  status: '상태',
};

function getInteractionTypeLabel(inputType: QuestionInputType | null | undefined): string {
  return (inputType && QUESTION_TYPE_LABELS[inputType]) || '객관식';
}

function getInteractionVisibilityLabel(visibility: ResultVisibility | null | undefined): string {
  return visibility === 'public' ? '공개' : '비공개';
}

function TemplateDetail({
  template,
  interactions,
  editable,
  busy,
  onDuplicate,
}: {
  template: LessonTemplateDoc;
  interactions: LessonInteractionDoc[];
  editable: boolean;
  busy: boolean;
  onDuplicate: (templateId: string) => void;
}) {
  const isShared =
    template.shared ||
    template.templateVisibility === 'shared' ||
    template.templateVisibility === 'org';
  const visibilityLabel = isShared ? '공유 템플릿' : '개인용';
  const description = template.description?.trim() ?? '';
  const subjectType = template.subject?.trim() ?? '';
  const targetGrade = template.targetGrade?.trim() ?? '';
  const toolList = (template.toolTags ?? []).map((tool) => tool.trim()).filter(Boolean);
  const questionCount = template.interactionCount ?? interactions.length;

  return (
    <>
      <header className="templateDetailHeader">
        <div className="templateDetailTitleBlock">
          <p className="templateDetailEyebrow">
            <FileText size={16} aria-hidden="true" />
            템플릿 정보
          </p>
          <h2>{template.title}</h2>
          <div className="templateDetailBadges">
            <span className="detailBadge detailBadgeBlue">
              {isShared ? <Globe size={15} aria-hidden="true" /> : <User size={15} aria-hidden="true" />}
              {visibilityLabel}
            </span>
            <span className="detailBadge detailBadgeNeutral">
              <List size={15} aria-hidden="true" />
              질문 {questionCount}개
            </span>
          </div>
        </div>

        <div className="templateDetailHeaderActions">
          {editable ? (
            <Link className="detailSecondaryButton" to={`/custom-template/${template.id}`}>
              <PencilLine size={17} aria-hidden="true" />
              편집
            </Link>
          ) : null}
          <button
            type="button"
            className="detailSecondaryButton"
            disabled={busy}
            onClick={() => onDuplicate(template.id)}
          >
            <CopyPlus size={17} aria-hidden="true" />
            복제
          </button>
        </div>
      </header>

      <div className="templateDetailBody">
        <div className="templateDetailContentGrid">
          <section className="detailSection detailSection--desc">
            <h3>설명</h3>
            {description ? (
              <div className="descriptionBox">{description}</div>
            ) : (
              <div className="emptyInfoBox">설명이 없습니다.</div>
            )}
          </section>

          <section className="detailSection detailSection--summary">
            <h3>요약 정보</h3>
            <dl className="templateSummaryGrid">
              <div className="summaryTile">
                <dt>
                  <Globe size={18} aria-hidden="true" />
                  공개 범위
                </dt>
                <dd>{visibilityLabel}</dd>
              </div>
              <div className="summaryTile">
                <dt>
                  <BookOpen size={18} aria-hidden="true" />
                  과목 유형
                </dt>
                <dd>{subjectType || '미입력'}</dd>
              </div>
              <div className="summaryTile">
                <dt>
                  <GraduationCap size={18} aria-hidden="true" />
                  대상 학년
                </dt>
                <dd>{targetGrade || '미입력'}</dd>
              </div>
              <div className="summaryTile">
                <dt>
                  <FileText size={18} aria-hidden="true" />
                  질문 수
                </dt>
                <dd>{questionCount}개</dd>
              </div>
            </dl>
          </section>

          <section className="detailSection detailSection--tools">
            <h3>사용 툴</h3>
            {toolList.length > 0 ? (
              <div className="toolChipList">
                {toolList.map((tool) => (
                  <span key={tool} className="toolChip">
                    {tool}
                  </span>
                ))}
              </div>
            ) : (
              <div className="emptyInfoBox">미입력</div>
            )}
          </section>

          <section className="detailSection detailSection--questions">
            <div className="detailSectionHeader">
              <h3>질문 미리보기</h3>
              <span>{questionCount}개</span>
            </div>
            {interactions.length > 0 ? (
              <div className="questionPreviewList">
                {interactions.map((interaction, index) => (
                  <article key={interaction.id} className="questionPreviewCard">
                    <span className="questionNumberBadge">
                      Q{String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="questionPreviewContent">
                      <strong>{interaction.title || `질문 ${index + 1}`}</strong>
                      <span>
                        {getInteractionTypeLabel(interaction.inputType)}
                        {' · '}
                        {getInteractionVisibilityLabel(interaction.visibility)}
                        {' · '}
                        선택지 {interaction.choices?.length ?? 0}개
                      </span>
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="emptyInfoBox">등록된 질문이 없습니다.</div>
            )}
          </section>
        </div>
      </div>

      <footer className="templateDetailFooter">
        <Link className="primaryUseTemplateButton" to={`/custom-session?template=${template.id}`}>
          템플릿으로 설문 제작
        </Link>
      </footer>
    </>
  );
}

function LessonTemplateLibraryContent({ ownerUid }: { ownerUid: string }) {
  const navigate = useNavigate();
  const { profile } = useUserProfile(ownerUid);
  const { myTemplates, sharedTemplates, loading, error } = useLessonTemplateLibrary(
    ownerUid,
    profile?.organizationId ?? 'dorossaem',
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyTemplateId, setBusyTemplateId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('selected');
  const appliedRequestedRef = useRef(false);
  const [filter, setFilter] = useState<'mine' | 'shared'>('mine');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 모바일(≤960px)에서 목록/정보를 탭으로 전환한다.
  const [activePane, setActivePane] = useState<'meta' | 'questions'>('meta');

  const orgTemplates = useMemo(
    () => sharedTemplates.filter((template) => template.ownerUid !== ownerUid),
    [ownerUid, sharedTemplates],
  );

  const activeTemplates = filter === 'mine' ? myTemplates : orgTemplates;
  const selected = activeTemplates.find((template) => template.id === selectedId) ?? null;
  const { interactions: selectedInteractions } = useLessonTemplateDetail(selected?.id);

  // 필터/목록이 바뀌면 첫 항목을 자동 선택한다.
  // 저장 직후 ?selected= 로 진입하면 해당 템플릿을 우선 선택한다(최초 1회).
  useEffect(() => {
    if (activeTemplates.length === 0) {
      setSelectedId(null);
      return;
    }
    if (
      requestedId &&
      !appliedRequestedRef.current &&
      activeTemplates.some((template) => template.id === requestedId)
    ) {
      appliedRequestedRef.current = true;
      setSelectedId(requestedId);
      setActivePane('questions');
      return;
    }
    if (!activeTemplates.some((template) => template.id === selectedId)) {
      setSelectedId(activeTemplates[0].id);
    }
  }, [activeTemplates, selectedId, requestedId]);

  const handleDuplicate = async (templateId: string) => {
    try {
      setBusyTemplateId(templateId);
      setActionError(null);
      const newTemplateId = await duplicateLessonTemplate(templateId, {
        uid: ownerUid,
        organizationId: profile?.organizationId ?? 'dorossaem',
      });
      navigate(`/custom-template/${newTemplateId}`);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : '템플릿 복제에 실패했습니다.');
    } finally {
      setBusyTemplateId(null);
    }
  };

  const handleSelect = (templateId: string) => {
    setSelectedId(templateId);
    setActivePane('questions');
  };

  return (
    <main className="templateBuilderPage">
      <div className="templateBuilderShell">
        <header className="templateBuilderToolbar">
          <h1>설문지 템플릿</h1>
          <div className="templateBuilderActions">
            <Link className="builder-link-button" to="/custom-template">
              <LayoutTemplate size={16} />
              새 템플릿 만들기
            </Link>
          </div>
        </header>

        <div className="library-filter" role="radiogroup" aria-label="템플릿 종류 필터">
          <label className={`library-filter__option ${filter === 'mine' ? 'isActive' : ''}`}>
            <input
              type="radio"
              name="templateFilter"
              checked={filter === 'mine'}
              onChange={() => setFilter('mine')}
            />
            <span>내 템플릿 ({myTemplates.length})</span>
          </label>
          <label className={`library-filter__option ${filter === 'shared' ? 'isActive' : ''}`}>
            <input
              type="radio"
              name="templateFilter"
              checked={filter === 'shared'}
              onChange={() => setFilter('shared')}
            />
            <span>공유 템플릿 ({orgTemplates.length})</span>
          </label>
        </div>

        {error ? <div className="inline-message inline-message--error">{error}</div> : null}
        {actionError ? <div className="inline-message inline-message--error">{actionError}</div> : null}

        <div className="mobilePaneTabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activePane === 'meta'}
            className={`mobilePaneTab ${activePane === 'meta' ? 'isActive' : ''}`}
            onClick={() => setActivePane('meta')}
          >
            목록
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activePane === 'questions'}
            className={`mobilePaneTab ${activePane === 'questions' ? 'isActive' : ''}`}
            onClick={() => setActivePane('questions')}
          >
            정보
          </button>
        </div>

        <section className="templateBuilderWorkspace" data-active-pane={activePane}>
          <aside className="templateMetaPanel">
            <header className="builderPaneHeader">
              <h2>템플릿 목록</h2>
            </header>
            <div className="templateMetaScroll">
              {loading ? null : activeTemplates.length === 0 ? (
                <div className="library-section__empty">
                  {filter === 'mine' ? <FolderKanban size={20} /> : <BookCopy size={20} />}
                  <strong>
                    {filter === 'mine' ? '아직 만든 템플릿이 없습니다.' : '아직 공유된 템플릿이 없습니다.'}
                  </strong>
                </div>
              ) : (
                <div className="templateList">
                  {activeTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`templateListRow ${template.id === selectedId ? 'isActive' : ''}`}
                      onClick={() => handleSelect(template.id)}
                    >
                      <strong>{template.title}</strong>
                      <span>질문 {template.interactionCount ?? 0}개</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="questionBuilderPanel">
            {selected ? (
              <TemplateDetail
                template={selected}
                interactions={selectedInteractions}
                editable={filter === 'mine'}
                busy={busyTemplateId === selected.id}
                onDuplicate={handleDuplicate}
              />
            ) : (
              <div className="templateDetailEmpty">
                <FileText className="templateDetailEmptyIcon" aria-hidden="true" />
                <h2>템플릿을 선택하세요</h2>
                <p>왼쪽 목록에서 템플릿을 선택하면 상세 정보가 표시됩니다.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

export function LessonTemplateLibraryPage() {
  const { user } = usePresenterAuth();
  if (!user) {
    return null;
  }
  return <LessonTemplateLibraryContent ownerUid={user.uid} />;
}
