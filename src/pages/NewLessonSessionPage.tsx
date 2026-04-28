import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { ExternalLink, Link2, MonitorPlay, PlayCircle, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { TeacherGate } from '../components/teacher/TeacherGate';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { QrPanel } from '../components/admin/QrPanel';
import { createSessionFromLessonTemplate } from '../firebase/lessonTemplates';
import { signOutUser } from '../firebase/auth';
import { useLessonTemplateLibrary } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';
import { buildAppUrl, buildHashPath } from '../utils/urls';

function createSessionIdSuggestion() {
  return `session-${nanoid(6).toLowerCase()}`;
}

function buildSessionLinks(sessionId: string) {
  return {
    student: buildAppUrl('/student', sessionId),
    admin: buildAppUrl('/admin', sessionId),
    display: buildAppUrl('/display', sessionId),
  };
}

function LessonSessionContent({ ownerUid }: { ownerUid: string }) {
  const [searchParams] = useSearchParams();
  const initialTemplateId = searchParams.get('template')?.trim() ?? '';
  const { profile } = useUserProfile(ownerUid);
  const { myTemplates, sharedTemplates, loading } = useLessonTemplateLibrary(
    ownerUid,
    profile?.organizationId ?? 'dorossaem',
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId);
  const [sessionId, setSessionId] = useState(createSessionIdSuggestion());
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLinks, setCreatedLinks] = useState<ReturnType<typeof buildSessionLinks> | null>(null);

  const templates = useMemo(() => {
    const merged = [...myTemplates, ...sharedTemplates];
    return merged.filter((template, index) => merged.findIndex((item) => item.id === template.id) === index);
  }, [myTemplates, sharedTemplates]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? null;

  useEffect(() => {
    if (!selectedTemplate && templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
      return;
    }

    if (selectedTemplate && !title.trim()) {
      setTitle(selectedTemplate.title);
    }
  }, [selectedTemplate, selectedTemplateId, templates, title]);

  const handleCreate = async () => {
    if (!selectedTemplateId) {
      setError('세션을 만들 lesson template을 선택해주세요.');
      return;
    }

    if (!sessionId.trim()) {
      setError('sessionId를 입력해주세요.');
      return;
    }

    if (!title.trim()) {
      setError('세션 제목을 입력해주세요.');
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await createSessionFromLessonTemplate(selectedTemplateId, sessionId.trim(), title.trim(), {
        uid: ownerUid,
        organizationId: profile?.organizationId ?? 'dorossaem',
      });
      setCreatedLinks(buildSessionLinks(sessionId.trim()));
    } catch (nextError) {
      setCreatedLinks(null);
      setError(nextError instanceof Error ? nextError.message : '세션 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="session-new-page">
      <Card className="session-new-card" tone="accent">
        <div className="builder-section-head">
          <div>
            <h3>새 live session 만들기</h3>
            <p>lesson template을 선택하고 sessionId와 제목을 입력하면 질문 세트가 바로 생성됩니다.</p>
          </div>
          <Badge tone="accent">{selectedTemplate ? 'Template linked' : 'Select template'}</Badge>
        </div>

        <div className="session-new-grid">
          <label className="form-field">
            <span className="form-label">Lesson template</span>
            <select
              className="select-sm session-new-select"
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              <option value="">템플릿 선택</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title} · {template.subject}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="sessionId"
            placeholder="예: ai-image-lab-0421"
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value.trim().toLowerCase())}
          />
          <Input
            label="Session title"
            placeholder="예: AI 이미지 생성 실습 1반"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="session-new-actions">
          <Button size="sm" variant="secondary" onClick={() => setSessionId(createSessionIdSuggestion())}>
            추천 sessionId 다시 만들기
          </Button>
          <Button disabled={busy || loading} onClick={() => void handleCreate()}>
            <PlayCircle size={16} />
            {busy ? '세션 생성 중...' : 'createSessionFromLessonTemplate 실행'}
          </Button>
        </div>

        {selectedTemplate ? (
          <div className="session-template-preview">
            <div>
              <strong>{selectedTemplate.title}</strong>
              <p>{selectedTemplate.description || '설명이 아직 없습니다.'}</p>
            </div>
            <div className="session-template-preview__meta">
              <Badge>{selectedTemplate.subject}</Badge>
              {selectedTemplate.targetGrade ? <Badge>{selectedTemplate.targetGrade}</Badge> : null}
              <Badge tone="success">{selectedTemplate.interactionCount ?? 0} interactions</Badge>
            </div>
          </div>
        ) : null}

        {error ? <div className="inline-message inline-message--error">{error}</div> : null}
      </Card>

      {loading ? (
        <Card className="waiting-state">
          <p>템플릿 목록을 불러오는 중입니다.</p>
        </Card>
      ) : null}

      {createdLinks ? (
        <div className="session-result-grid">
          <QrPanel url={createdLinks.student} />

          <Card className="session-links-card">
            <div className="builder-section-head">
              <div>
                <h3>생성 완료</h3>
                <p>Student/Admin/Display 링크를 바로 열거나 복사해서 수업에 사용하세요.</p>
              </div>
              <Badge tone="success">{sessionId}</Badge>
            </div>

            <div className="session-link-list">
              <a className="session-link-card" href={buildHashPath('/student', sessionId)}>
                <div className="session-link-card__icon">
                  <Smartphone size={18} />
                </div>
                <div>
                  <strong>Student</strong>
                  <p>{createdLinks.student}</p>
                </div>
                <ExternalLink size={16} />
              </a>

              <a className="session-link-card" href={buildHashPath('/admin', sessionId)}>
                <div className="session-link-card__icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong>Admin</strong>
                  <p>{createdLinks.admin}</p>
                </div>
                <ExternalLink size={16} />
              </a>

              <a className="session-link-card" href={buildHashPath('/display', sessionId)}>
                <div className="session-link-card__icon">
                  <MonitorPlay size={18} />
                </div>
                <div>
                  <strong>Display</strong>
                  <p>{createdLinks.display}</p>
                </div>
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="session-links-footer">
              <Link className="builder-link-button" to={`/admin?session=${sessionId}`}>
                <Link2 size={16} />
                Admin 열기
              </Link>
              <Link className="builder-link-button builder-link-button--ghost" to="/library">
                <QrCode size={16} />
                라이브러리로 돌아가기
              </Link>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export function NewLessonSessionPage() {
  return (
    <TeacherGate
      compact
      description="lesson template에서 실제 live session을 생성하고 학생/Admin/Display 링크를 바로 배포합니다."
      eyebrow="DORO Session"
      title="New Lesson Session"
      actions={() => (
        <div className="hero-actions">
          <Button size="sm" variant="ghost" onClick={() => { void signOutUser(); }}>
            로그아웃
          </Button>
        </div>
      )}
      loginAside={
        <Card className="banner-card">
          <h3>Session 생성 흐름</h3>
          <ol className="flow-list">
            <li>lesson template을 하나 고릅니다.</li>
            <li>sessionId와 수업 제목을 입력합니다.</li>
            <li>생성 후 QR과 Student/Admin/Display 링크를 바로 배포합니다.</li>
          </ol>
        </Card>
      }
    >
      {(user) => <LessonSessionContent ownerUid={user.uid} />}
    </TeacherGate>
  );
}
