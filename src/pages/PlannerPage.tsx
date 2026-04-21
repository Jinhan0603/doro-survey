import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { WaitingState } from '../components/survey/WaitingState';
import { signInAdminWithEmail, signOutUser } from '../firebase/auth';
import { firebaseConfigStatus } from '../firebase/client';
import { createTemplate, deleteTemplate } from '../firebase/lessonTemplates';
import type {
  LessonTemplateDoc,
  PhaseType,
  InteractionType,
  InteractionVisibility,
  TemplatePhase,
  TemplateQuestion,
} from '../firebase/types';
import { useAuth } from '../hooks/useAuth';
import { useTemplates } from '../hooks/useTemplates';

const PHASE_ORDER: PhaseType[] = ['도입', '이론', '실습', '윤리', '마무리'];

const PHASE_COLORS: Record<PhaseType, string> = {
  도입: 'var(--color-phase-intro)',
  이론: 'var(--color-phase-theory)',
  실습: 'var(--color-phase-practice)',
  윤리: 'var(--color-phase-ethics)',
  마무리: 'var(--color-phase-closing)',
};

const INTERACTION_LABELS: Record<InteractionType, string> = {
  survey: '설문',
  quiz: '퀴즈',
  discussion: '토론',
  reflection: '성찰',
};

function PhaseTag({ type }: { type: PhaseType }) {
  return (
    <span
      className="phase-tag"
      style={{ '--phase-color': PHASE_COLORS[type] } as React.CSSProperties}
    >
      {type}
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
  const totalQuestions = template.phases.reduce((sum, p) => sum + p.questions.length, 0);

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

      <div className="template-card__phases">
        {template.phases.map((phase) => (
          <div key={phase.id} className="phase-block">
            <PhaseTag type={phase.type} />
            <span className="phase-block__label">{phase.label}</span>
            <span className="phase-block__count">{phase.questions.length}개</span>
          </div>
        ))}
      </div>

      <div className="template-card__footer">
        <span className="template-card__meta">총 {totalQuestions}개 질문</span>
      </div>
    </Card>
  );
}

type NewPhaseQuestion = {
  title: string;
  prompt: string;
  type: 'choice' | 'text';
  interactionType: InteractionType;
  visibility: InteractionVisibility;
  choices: string;
};

type NewPhase = {
  type: PhaseType;
  label: string;
  questions: NewPhaseQuestion[];
};

function defaultPhase(type: PhaseType): NewPhase {
  return {
    type,
    label: `${type} 단계`,
    questions: [
      {
        title: '',
        prompt: '',
        type: 'text',
        interactionType: 'survey',
        visibility: 'public',
        choices: '',
      },
    ],
  };
}

function TemplateForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [phases, setPhases] = useState<NewPhase[]>([defaultPhase('도입')]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPhase = (type: PhaseType) => {
    setPhases((prev) => [...prev, defaultPhase(type)]);
  };

  const removePhase = (index: number) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, patch: Partial<NewPhase>) => {
    setPhases((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const addQuestion = (phaseIndex: number) => {
    const updated = phases.map((p, i) => {
      if (i !== phaseIndex) return p;
      return {
        ...p,
        questions: [
          ...p.questions,
          {
            title: '',
            prompt: '',
            type: 'text' as const,
            interactionType: 'survey' as InteractionType,
            visibility: 'public' as InteractionVisibility,
            choices: '',
          },
        ],
      };
    });
    setPhases(updated);
  };

  const updateQuestion = (phaseIndex: number, qIndex: number, patch: Partial<NewPhaseQuestion>) => {
    const updated = phases.map((p, i) => {
      if (i !== phaseIndex) return p;
      return {
        ...p,
        questions: p.questions.map((q, qi) => (qi === qIndex ? { ...q, ...patch } : q)),
      };
    });
    setPhases(updated);
  };

  const removeQuestion = (phaseIndex: number, qIndex: number) => {
    const updated = phases.map((p, i) => {
      if (i !== phaseIndex) return p;
      return { ...p, questions: p.questions.filter((_, qi) => qi !== qIndex) };
    });
    setPhases(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !subject.trim()) {
      setError('제목과 수업 주제를 입력해주세요.');
      return;
    }
    if (phases.every((p) => p.questions.length === 0)) {
      setError('최소 하나의 질문을 추가해주세요.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const templatePhases: TemplatePhase[] = phases.map((p, pi) => ({
        id: `phase-${pi}`,
        type: p.type,
        label: p.label || `${p.type} 단계`,
        questions: p.questions.map((q, qi) => {
          const templateQ: TemplateQuestion = {
            order: qi + 1,
            type: q.type,
            interactionType: q.interactionType,
            visibility: q.visibility,
            title: q.title.trim() || `${INTERACTION_LABELS[q.interactionType]} 질문 ${qi + 1}`,
            prompt: q.prompt.trim(),
            choices: q.type === 'choice'
              ? q.choices.split('\n').map((c) => c.trim()).filter(Boolean)
              : [],
            maxLength: 300,
          };
          return templateQ;
        }),
      }));

      await createTemplate({ title: title.trim(), subject: subject.trim(), description: description.trim(), phases: templatePhases });
      onCreated();
    } catch (e) {
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
      </div>

      <div className="template-form__phases">
        {phases.map((phase, pi) => (
          <Card key={pi} className="template-form__phase-card">
            <div className="template-form__phase-header">
              <div className="template-form__phase-meta">
                <PhaseTag type={phase.type} />
                <Input
                  label=""
                  placeholder="단계 이름"
                  value={phase.label}
                  onChange={(e) => updatePhase(pi, { label: e.target.value })}
                />
              </div>
              <Button size="sm" variant="ghost" onClick={() => removePhase(pi)}>× 단계 삭제</Button>
            </div>

            <div className="template-form__questions">
              {phase.questions.map((q, qi) => (
                <div key={qi} className="template-form__question">
                  <div className="template-form__question-header">
                    <span className="template-form__question-num">Q{qi + 1}</span>
                    <div className="template-form__question-meta">
                      <select
                        className="select-sm"
                        value={q.interactionType}
                        onChange={(e) => updateQuestion(pi, qi, { interactionType: e.target.value as InteractionType })}
                      >
                        {Object.entries(INTERACTION_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <select
                        className="select-sm"
                        value={q.type}
                        onChange={(e) => updateQuestion(pi, qi, { type: e.target.value as 'choice' | 'text' })}
                      >
                        <option value="text">주관식</option>
                        <option value="choice">객관식</option>
                      </select>
                      <select
                        className="select-sm"
                        value={q.visibility}
                        onChange={(e) => updateQuestion(pi, qi, { visibility: e.target.value as InteractionVisibility })}
                      >
                        <option value="public">공개</option>
                        <option value="teacher-only">강사 전용</option>
                      </select>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeQuestion(pi, qi)}>×</Button>
                  </div>

                  <Input
                    label="질문 제목"
                    placeholder="짧은 제목 (예: 가장 흥미로운 주제는?)"
                    value={q.title}
                    onChange={(e) => updateQuestion(pi, qi, { title: e.target.value })}
                  />
                  <Input
                    label="질문 내용"
                    placeholder="학생에게 보여줄 질문 내용"
                    value={q.prompt}
                    onChange={(e) => updateQuestion(pi, qi, { prompt: e.target.value })}
                  />
                  {q.type === 'choice' && (
                    <div className="form-field">
                      <label className="form-label">선택지 (한 줄에 하나씩)</label>
                      <textarea
                        className="textarea-sm"
                        rows={3}
                        placeholder={"예시\n아이디어 발굴\n시장 조사\n팀 구성"}
                        value={q.choices}
                        onChange={(e) => updateQuestion(pi, qi, { choices: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button size="sm" variant="ghost" onClick={() => addQuestion(pi)}>
              + 질문 추가
            </Button>
          </Card>
        ))}
      </div>

      <div className="template-form__add-phase">
        <span className="template-form__add-label">단계 추가:</span>
        {PHASE_ORDER.map((type) => (
          <Button key={type} size="sm" variant="ghost" onClick={() => addPhase(type)}>
            + {type}
          </Button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="template-form__actions">
        <Button disabled={busy} onClick={handleSubmit}>
          {busy ? '저장 중...' : '템플릿 저장'}
        </Button>
      </div>
    </div>
  );
}

export function PlannerPage() {
  const { user, loading: authLoading } = useAuth();
  const firestoreEnabled = !authLoading && !!user;
  const { templates, loading } = useTemplates({ enabled: firestoreEnabled });
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
      await deleteTemplate(templateId);
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
          <h2 className="planner-page__section-heading">수업 템플릿</h2>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? '취소' : '+ 새 템플릿'}
          </Button>
        </div>

        {showForm && (
          <TemplateForm
            onCreated={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <WaitingState title="템플릿 불러오는 중..." description="잠시만 기다려주세요." />
        ) : templates.length === 0 ? (
          <Card className="planner-empty">
            <p>아직 수업 템플릿이 없습니다.</p>
            <p>오른쪽 위의 <strong>+ 새 템플릿</strong> 버튼으로 첫 수업을 설계해보세요.</p>
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
            {PHASE_ORDER.map((type, i) => (
              <div key={type} className="phase-guide-step">
                <PhaseTag type={type} />
                {i < PHASE_ORDER.length - 1 && <span className="phase-guide-arrow">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
