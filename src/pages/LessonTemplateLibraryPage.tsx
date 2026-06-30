import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCopy, CopyPlus, FolderKanban, LayoutTemplate, PencilLine, PlayCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { usePresenterAuth } from '../auth/AuthProvider';
import { duplicateLessonTemplate } from '../firebase/lessonTemplates';
import { useLessonTemplateLibrary } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';
import type { LessonTemplateDoc } from '../firebase/types';
import '../styles/survey-builder.css';
import '../styles/template-builder.css';

function TemplateDetail({
  template,
  editable,
  busy,
  onDuplicate,
}: {
  template: LessonTemplateDoc;
  editable: boolean;
  busy: boolean;
  onDuplicate: (templateId: string) => void;
}) {
  return (
    <div className="templateDetail">
      <h3 className="templateDetail__title">{template.title}</h3>
      <p className="templateDetail__desc">{template.description || '설명이 아직 없습니다.'}</p>

      <div className="templateDetail__meta">
        {template.subject ? <span>{template.subject}</span> : null}
        {template.targetGrade ? <span>{template.targetGrade}</span> : null}
        <span>질문 {template.interactionCount ?? 0}개</span>
      </div>

      {template.toolTags?.length ? (
        <div className="templateDetail__tags">
          {template.toolTags.map((tool) => (
            <span key={tool} className="library-template-tag">
              {tool}
            </span>
          ))}
        </div>
      ) : null}

      <div className="templateDetail__actions">
        <Link className="builder-link-button" to={`/custom-session?template=${template.id}`}>
          <PlayCircle size={16} />
          템플릿으로 설문 제작
        </Link>
        {editable ? (
          <Link className="builder-link-button builder-link-button--ghost" to={`/custom-template/${template.id}`}>
            <PencilLine size={16} />
            편집
          </Link>
        ) : null}
        <Button disabled={busy} size="sm" variant="secondary" onClick={() => onDuplicate(template.id)}>
          <CopyPlus size={16} />
          복제하기
        </Button>
      </div>
    </div>
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

  // 필터/목록이 바뀌면 첫 항목을 자동 선택한다.
  useEffect(() => {
    if (activeTemplates.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!activeTemplates.some((template) => template.id === selectedId)) {
      setSelectedId(activeTemplates[0].id);
    }
  }, [activeTemplates, selectedId]);

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
            <header className="questionBuilderHeader">
              <div className="builderPaneHeader">
                <h2>템플릿 정보</h2>
              </div>
            </header>
            <div className="questionBuilderScroll">
              {selected ? (
                <TemplateDetail
                  template={selected}
                  editable={filter === 'mine'}
                  busy={busyTemplateId === selected.id}
                  onDuplicate={handleDuplicate}
                />
              ) : (
                <div className="library-section__empty">
                  <FolderKanban size={20} />
                  <strong>왼쪽에서 템플릿을 선택하세요.</strong>
                </div>
              )}
            </div>
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
