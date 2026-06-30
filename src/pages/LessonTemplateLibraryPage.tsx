import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCopy, CopyPlus, FolderKanban, LayoutTemplate, PencilLine, PlayCircle } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { TeacherGate } from '../components/teacher/TeacherGate';
import { PHASE_ORDER, PHASE_SHORT_LABELS } from '../data/lessonTemplatePresets';
import { duplicateLessonTemplate, updateLessonTemplate } from '../firebase/lessonTemplates';
import { signOutUser } from '../firebase/auth';
import { useLessonTemplateLibrary } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';
import type { LessonTemplateDoc, TemplateVisibility } from '../firebase/types';

const TEMPLATE_VISIBILITY_LABELS: Record<TemplateVisibility, string> = {
  private: '개인용',
  org: '조직 공유',
  shared: '전체 공유',
};

function TemplateCard({
  template,
  leadingLabel,
  busy = false,
  onDuplicate,
  onVisibilityChange,
  editable = false,
}: {
  template: LessonTemplateDoc;
  leadingLabel: string;
  busy?: boolean;
  onDuplicate: (templateId: string) => void;
  onVisibilityChange: (templateId: string, visibility: TemplateVisibility) => void;
  editable?: boolean;
}) {
  const visibility = template.templateVisibility ?? (template.shared ? 'org' : 'private');

  return (
    <Card className="library-template-card">
      <div className="library-template-card__header">
        <div className="library-template-card__labels">
          <Badge>{leadingLabel}</Badge>
          <Badge tone={visibility === 'private' ? 'default' : 'accent'}>
            {TEMPLATE_VISIBILITY_LABELS[visibility]}
          </Badge>
        </div>
        <Link className="builder-link-button builder-link-button--ghost" to={`/builder/${template.id}`}>
          편집
        </Link>
      </div>

      <div className="library-template-card__copy">
        <h3>{template.title}</h3>
        <p>{template.description || '설명이 아직 없습니다.'}</p>
      </div>

      <div className="library-template-card__meta">
        <span>{template.subject}</span>
        {template.targetGrade ? <span>{template.targetGrade}</span> : null}
        <span>질문 {template.interactionCount ?? 0}개</span>
        <span>슬라이드 {template.slideCount ?? 0}개</span>
      </div>

      {template.toolTags?.length ? (
        <div className="library-template-card__tags">
          {template.toolTags.map((tool) => (
            <span key={tool} className="library-template-tag">
              {tool}
            </span>
          ))}
        </div>
      ) : null}

      <div className="library-template-card__phases">
        {PHASE_ORDER.map((phase) => (
          <div key={phase} className="library-template-phase">
            <span>{PHASE_SHORT_LABELS[phase]}</span>
          </div>
        ))}
      </div>

      <div className="library-template-card__actions">
        <Link className="builder-link-button" to={`/session-new?template=${template.id}`}>
          <PlayCircle size={16} />
          세션 열기
        </Link>
        <Button disabled={busy} size="sm" variant="secondary" onClick={() => onDuplicate(template.id)}>
          <CopyPlus size={16} />
          {busy ? '복제 중...' : '복제하기'}
        </Button>
      </div>

      {editable ? (
        <label className="form-field">
          <span className="form-label">공개 범위</span>
          <select
            className="select-sm"
            value={visibility}
            onChange={(event) => onVisibilityChange(template.id, event.target.value as TemplateVisibility)}
          >
            {(Object.entries(TEMPLATE_VISIBILITY_LABELS) as [TemplateVisibility, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </Card>
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

  const orgTemplates = useMemo(
    () => sharedTemplates.filter((template) => template.ownerUid !== ownerUid),
    [ownerUid, sharedTemplates],
  );

  const handleDuplicate = async (templateId: string) => {
    try {
      setBusyTemplateId(templateId);
      setActionError(null);
      const newTemplateId = await duplicateLessonTemplate(templateId, {
        uid: ownerUid,
        organizationId: profile?.organizationId ?? 'dorossaem',
      });
      navigate(`/builder/${newTemplateId}`);
    } catch (nextError) {
      setActionError(
        nextError instanceof Error ? nextError.message : '템플릿 복제에 실패했습니다.',
      );
    } finally {
      setBusyTemplateId(null);
    }
  };

  const handleVisibilityChange = async (templateId: string, visibility: TemplateVisibility) => {
    try {
      setBusyTemplateId(templateId);
      setActionError(null);
      await updateLessonTemplate(templateId, {
        templateVisibility: visibility,
        organizationId: profile?.organizationId ?? 'dorossaem',
      });
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : 'visibility 변경에 실패했습니다.');
    } finally {
      setBusyTemplateId(null);
    }
  };

  return (
    <div className="library-page">
      <Card className="library-hero-card" tone="accent">
        <div className="library-hero-card__copy">
          <h2>반복해서 쓸 수업 흐름을 관리합니다.</h2>
          <p>자주 쓰는 질문 묶음은 템플릿으로 저장하고, 오늘만 쓸 질문은 직접 질문 만들기로 바로 시작하세요.</p>
        </div>
        <div className="library-hero-card__actions">
          <Link className="builder-link-button" to="/builder">
            <LayoutTemplate size={16} />
            새 템플릿 만들기
          </Link>
          <Link className="builder-link-button builder-link-button--ghost" to="/session-new">
            <PlayCircle size={16} />
            템플릿 세션 열기
          </Link>
          <Link className="builder-link-button builder-link-button--ghost" to="/custom-session">
            <PencilLine size={16} />
            직접 질문 만들기
          </Link>
        </div>
      </Card>

      {error ? <div className="inline-message inline-message--error">{error}</div> : null}
      {actionError ? <div className="inline-message inline-message--error">{actionError}</div> : null}

      <div className="library-section">
        <div className="library-section__header">
          <div>
            <h3>내 설문지 템플릿</h3>
            <p>직접 만든 질문 흐름을 수정하고 새 운영 세션으로 연결합니다.</p>
          </div>
        </div>

        {loading ? (
          <Card className="waiting-state">
            <p>템플릿을 불러오는 중입니다.</p>
          </Card>
        ) : myTemplates.length === 0 ? (
          <Card className="library-empty-card">
            <FolderKanban size={20} />
            <strong>아직 만든 템플릿이 없습니다.</strong>
            <p>반복해서 쓸 수업은 템플릿으로, 오늘만 쓸 질문은 직접 질문 만들기로 시작하세요.</p>
          </Card>
        ) : (
          <div className="library-grid">
            {myTemplates.map((template) => (
              <TemplateCard
                busy={busyTemplateId === template.id}
                key={template.id}
                editable
                leadingLabel="내 템플릿"
                template={template}
                onDuplicate={handleDuplicate}
                onVisibilityChange={handleVisibilityChange}
              />
            ))}
          </div>
        )}
      </div>

      <div className="library-section">
        <div className="library-section__header">
          <div>
            <h3>공유 템플릿</h3>
            <p>같은 조직 또는 전체 공유 템플릿을 복제해 내 수업에 맞게 수정합니다.</p>
          </div>
        </div>

        {orgTemplates.length === 0 ? (
          <Card className="library-empty-card">
            <BookCopy size={20} />
            <strong>아직 공유된 템플릿이 없습니다.</strong>
            <p>내 템플릿의 공개 범위를 조직 공유나 전체 공유로 바꾸면 이 섹션에 나타납니다.</p>
          </Card>
        ) : (
          <div className="library-grid">
            {orgTemplates.map((template) => (
              <TemplateCard
                busy={busyTemplateId === template.id}
                key={template.id}
                leadingLabel="공유 템플릿"
                template={template}
                onDuplicate={handleDuplicate}
                onVisibilityChange={handleVisibilityChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function LessonTemplateLibraryPage() {
  return (
    <TeacherGate
      compact
      description="반복해서 쓸 수업 질문 흐름을 저장하고, 필요할 때 실제 운영 세션으로 전환합니다."
      title="설문지 템플릿"
      actions={() => (
        <div className="hero-actions">
          <Button size="sm" variant="ghost" onClick={() => { void signOutUser(); }}>
            로그아웃
          </Button>
        </div>
      )}
      loginAside={
        <Card className="banner-card">
          <h3>템플릿을 쓰는 경우</h3>
          <ul className="flow-list flow-list--bullet">
            <li>같은 수업을 여러 반에서 반복합니다.</li>
            <li>도입부터 마무리까지 질문 흐름을 미리 설계합니다.</li>
            <li>저장한 흐름으로 새 운영 세션을 만듭니다.</li>
          </ul>
        </Card>
      }
    >
      {(user) => <LessonTemplateLibraryContent ownerUid={user.uid} />}
    </TeacherGate>
  );
}
