import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { WaitingState } from '../components/survey/WaitingState';
import { signInAdminWithEmail, signOutUser } from '../firebase/auth';
import { firebaseConfigStatus } from '../firebase/client';
import {
  createLessonTemplate,
  deleteLessonTemplate,
  saveLessonInteractions,
  subscribeMyLessonTemplates,
} from '../firebase/lessonTemplates';
import type {
  InteractionType,
  LessonInteractionDoc,
  LessonPhase,
  LessonTemplateDoc,
  QuestionInputType,
  ResultVisibility,
} from '../firebase/types';
import { useAuth } from '../hooks/useAuth';

const PHASE_ORDER: LessonPhase[] = ['intro', 'theory', 'practice', 'ethics', 'wrapup'];

const PHASE_LABELS: Record<LessonPhase, string> = {
  intro: '도입',
  theory: '이론',
  practice: '실습',
  ethics: '윤리',
  wrapup: '마무리',
};

const PHASE_COLORS: Record<LessonPhase, string> = {
  intro: 'var(--color-phase-intro)',
  theory: 'var(--color-phase-theory)',
  practice: 'var(--color-phase-practice)',
  ethics: 'var(--color-phase-ethics)',
  wrapup: 'var(--color-phase-closing)',
};

const INTERACTION_LABELS: Record<InteractionType, string> = {
  'prior-knowledge': '사전 지식 확인',
  'prediction': '예측',
  'concept-check': '개념 확인',
  'confidence-check': '이해도 확인',
  'readiness-check': '준비도 확인',
  'progress-check': '진행 확인',
  'troubleshoot': '문제 해결',
  'ethics-case': '윤리 사례',
  'exit-ticket': '마무리 체크',
};

const INPUT_TYPE_LABELS: Record<QuestionInputType, string> = {
  choice: '객관식',
  text: '주관식',
  multi: '복수 선택',
  scale: '척도',
  status: '상태 체크',
};

const VISIBILITY_LABELS: Record<ResultVisibility, string> = {
  public: '공개',
  'teacher-only': '강사 전용',
  hidden: '비공개',
};

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

function TemplateCard({
  template,
  onDelete,
}: {
  template: LessonTemplateDoc;
  onDelete: () => void;
}) {
  return (
    <Card className="template-card">
      <div className="template-card__header">
        <div>
          <Badge>{template.subject}</Badge>
          <h3 className="template-card__title">{template.title}</h3>
          {template.description && (
            <p className="template-card__desc">{template.description}</p>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onDelete}>삭제</Button>
      </div>
      <div className="template-card__footer">
        <span className="template-card__meta">
          {template.shared ? '공유됨' : '비공개'}
          {' · '}schemaVersion {template.schemaVersion}
        </span>
      </div>
    </Card>
  );
}

type NewInteraction = {
  phase: LessonPhase;
  interactionType: InteractionType;
  inputType: QuestionInputType;
  visibility: ResultVisibility;
  title: string;
  prompt: string;
  choices: string;
};

function defaultInteraction(phase: LessonPhase): NewInteraction {
  return {
    phase,
    interactionType: 'concept-check',
    inputType: 'text',
    visibility: 'public',
    title: '',
    prompt: '',
    choices: '',
  };
}

function TemplateForm({
  ownerUid,
  onCreated,
  onCancel,
}: {
  ownerUid: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [shared, setShared] = useState(false);
  const [interactions, setInteractions] = useState<NewInteraction[]>([
    defaultInteraction('intro'),
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addInteraction = (phase: LessonPhase) => {
    setInteractions((prev) => [...prev, defaultInteraction(phase)]);
  };

  const removeInteraction = (index: number) => {
    setInteractions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInteraction = (index: number, patch: Partial<NewInteraction>) => {
    setInteractions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !subject.trim()) {
      setError('수업 제목과 주제를 입력해주세요.');
      return;
    }
    if (interactions.length === 0) {
      setError('최소 하나의 인터랙션을 추가해주세요.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const templateId = await createLessonTemplate({
        ownerUid,
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        shared,
      });

      const docs: Omit<LessonInteractionDoc, 'id' | 'createdAt' | 'updatedAt'>[] =
        interactions.map((item, i) => ({
          order: i + 1,
          phase: item.phase,
          interactionType: item.interactionType,
          purpose: 'learning' as const,
          inputType: item.inputType,
          visibility: item.visibility,
          title: item.title.trim() || `${INTERACTION_LABELS[item.interactionType]} ${i + 1}`,
          prompt: item.prompt.trim(),
          choices: item.inputType === 'choice' || item.inputType === 'multi'
            ? item.choices.split('\n').map((c) => c.trim()).filter(Boolean)
            : [],
          maxLength: 300,
          schemaVersion: 2,
        }));

      await saveLessonInteractions(templateId, docs);
      onCreated();
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="template-form">
      <h3 className="template-form__heading">새 수업 템플릿 만들기</h3>

      <div className="stack-sm">
        <Input
          label="수업 제목"
          placeholder="예: 로봇으로 창업하기 2강"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          label="수업 주제"
          placeholder="예: AI 활용, 로봇과 창업, 앱 개발"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <Input
          label="설명 (선택)"
          placeholder="수업 목표나 특이사항"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={shared}
            onChange={(e) => setShared(e.target.checked)}
          />
          다른 강사와 공유
        </label>
      </div>

      <div className="template-form__phases">
        {interactions.map((item, idx) => (
          <Card key={idx} className="template-form__phase-card">
            <div className="template-form__phase-header">
              <div className="template-form__phase-meta">
                <PhaseTag phase={item.phase} />
                <select
                  className="select-sm"
                  value={item.phase}
                  onChange={(e) => updateInteraction(idx, { phase: e.target.value as LessonPhase })}
                >
                  {PHASE_ORDER.map((p) => (
                    <option key={p} value={p}>{PHASE_LABELS[p]}</option>
                  ))}
                </select>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeInteraction(idx)}>×</Button>
            </div>

            <div className="template-form__question-meta" style={{ marginBottom: 12 }}>
              <select
                className="select-sm"
                value={item.interactionType}
                onChange={(e) => updateInteraction(idx, { interactionType: e.target.value as InteractionType })}
              >
                {(Object.entries(INTERACTION_LABELS) as [InteractionType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                className="select-sm"
                value={item.inputType}
                onChange={(e) => updateInteraction(idx, { inputType: e.target.value as QuestionInputType })}
              >
                {(Object.entries(INPUT_TYPE_LABELS) as [QuestionInputType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <select
                className="select-sm"
                value={item.visibility}
                onChange={(e) => updateInteraction(idx, { visibility: e.target.value as ResultVisibility })}
              >
                {(Object.entries(VISIBILITY_LABELS) as [ResultVisibility, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="stack-sm">
              <Input
                label="질문 제목"
                placeholder="짧은 제목"
                value={item.title}
                onChange={(e) => updateInteraction(idx, { title: e.target.value })}
              />
              <Input
                label="질문 내용"
                placeholder="학생에게 보여줄 질문"
                value={item.prompt}
                onChange={(e) => updateInteraction(idx, { prompt: e.target.value })}
              />
              {(item.inputType === 'choice' || item.inputType === 'multi') && (
                <div className="form-field">
                  <label className="form-label">선택지 (한 줄에 하나씩)</label>
                  <textarea
                    className="textarea-sm"
                    rows={3}
                    value={item.choices}
                    onChange={(e) => updateInteraction(idx, { choices: e.target.value })}
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="template-form__add-phase">
        <span className="template-form__add-label">인터랙션 추가:</span>
        {PHASE_ORDER.map((phase) => (
          <Button key={phase} size="sm" variant="ghost" onClick={() => addInteraction(phase)}>
            + {PHASE_LABELS[phase]}
          </Button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="template-form__actions" style={{ gap: 8 }}>
        <Button variant="ghost" onClick={onCancel}>취소</Button>
        <Button disabled={busy} onClick={handleSubmit}>
          {busy ? '저장 중...' : '템플릿 저장'}
        </Button>
      </div>
    </div>
  );
}

function useMyTemplates(uid: string | null) {
  const [templates, setTemplates] = useState<LessonTemplateDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !firebaseConfigStatus.isConfigured) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeMyLessonTemplates(uid, (t) => {
      setTemplates(t);
      setLoading(false);
    });
  }, [uid]);

  return { templates, loading };
}

export function PlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const { templates, loading } = useMyTemplates(user?.uid ?? null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!firebaseConfigStatus.isConfigured) {
    return (
      <AppShell compact title="수업 플래너">
        <Card>
          <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
            Firebase 설정이 필요합니다.
          </p>
        </Card>
      </AppShell>
    );
  }

  if (authLoading) {
    return (
      <AppShell compact title="수업 플래너">
        <WaitingState title="인증 확인 중..." description="잠시만 기다려주세요." />
      </AppShell>
    );
  }

  if (!user) {
    const handleLogin = async () => {
      if (!email || !password) return;
      setBusy(true);
      setAuthError(null);
      try {
        await signInAdminWithEmail(email, password);
      } catch {
        setAuthError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } finally {
        setBusy(false);
      }
    };

    return (
      <AppShell compact title="수업 플래너" eyebrow="강사 전용">
        <Card className="login-card">
          <h2 className="login-card__heading">강사 로그인</h2>
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />
          {authError && <p className="form-error">{authError}</p>}
          <Button disabled={busy} onClick={handleLogin}>
            {busy ? '로그인 중...' : '로그인'}
          </Button>
        </Card>
      </AppShell>
    );
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('이 템플릿을 삭제하시겠습니까?')) return;
    try {
      await deleteLessonTemplate(templateId);
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <AppShell
      compact
      title="수업 플래너"
      eyebrow="강사 전용"
      actions={
        <div className="hero-actions">
          <Button size="sm" variant="ghost" onClick={() => signOutUser()}>로그아웃</Button>
        </div>
      }
    >
      <div className="planner-page">
        <div className="planner-page__toolbar">
          <h2 className="planner-page__section-heading">내 수업 템플릿</h2>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? '취소' : '+ 새 템플릿'}
          </Button>
        </div>

        {showForm && (
          <TemplateForm
            ownerUid={user.uid}
            onCreated={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <WaitingState title="템플릿 불러오는 중..." description="잠시만 기다려주세요." />
        ) : templates.length === 0 ? (
          <Card className="planner-empty">
            <p>아직 수업 템플릿이 없습니다.</p>
            <p><strong>+ 새 템플릿</strong> 버튼으로 첫 수업을 설계해보세요.</p>
          </Card>
        ) : (
          <div className="template-grid">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onDelete={() => handleDeleteTemplate(t.id)}
              />
            ))}
          </div>
        )}

        <div className="planner-page__phase-guide">
          <h3>DORO 수업 진행 단계</h3>
          <div className="phase-guide-row">
            {PHASE_ORDER.map((phase, i) => (
              <div key={phase} className="phase-guide-step">
                <PhaseTag phase={phase} />
                {i < PHASE_ORDER.length - 1 && <span className="phase-guide-arrow">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
