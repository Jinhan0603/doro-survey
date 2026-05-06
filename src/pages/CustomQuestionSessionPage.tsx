import { useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { nanoid } from 'nanoid';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Link2,
  MonitorPlay,
  PlayCircle,
  Plus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { QrPanel } from '../components/admin/QrPanel';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { TeacherGate } from '../components/teacher/TeacherGate';
import {
  INPUT_TYPE_LABELS,
  PHASE_LABELS,
  PHASE_ORDER,
  VISIBILITY_LABELS,
} from '../data/lessonTemplatePresets';
import { signOutUser } from '../firebase/auth';
import {
  createCustomQuestionSession,
  type CustomSessionQuestionInput,
} from '../firebase/sessions';
import type { LessonPhase, QuestionInputType, ResultVisibility } from '../firebase/types';
import { useUserProfile } from '../hooks/useUserProfile';
import { buildAppUrl, buildHashPath } from '../utils/urls';

type CustomQuestionDraft = {
  clientId: string;
  phase: LessonPhase;
  title: string;
  prompt: string;
  inputType: QuestionInputType;
  visibility: ResultVisibility;
  choicesText: string;
  maxLength: number;
};

type CreatedSession = {
  sessionId: string;
  links: {
    student: string;
    admin: string;
    display: string;
  };
};

const DEFAULT_SESSION_TITLE = 'DORO 직접 질문 세션';

const INPUT_TYPE_HELP: Record<QuestionInputType, string> = {
  choice: '하나만 고르는 투표형 질문입니다.',
  text: '학생 생각을 짧은 문장으로 받습니다.',
  multi: '여러 항목을 동시에 고를 수 있습니다.',
  scale: '1~5처럼 정도를 빠르게 확인합니다.',
  status: '준비, 진행, 도움 필요 같은 운영 상태를 봅니다.',
};

const VISIBILITY_HELP: Record<ResultVisibility, string> = {
  public: 'Display에 공개할 수 있습니다.',
  'teacher-only': 'Admin에서만 집계합니다.',
  hidden: '결과 화면에 표시하지 않습니다.',
};

function createSessionIdSuggestion() {
  return `live-${nanoid(6).toLowerCase()}`;
}

function getDefaultChoices(inputType: QuestionInputType) {
  if (inputType === 'scale') {
    return ['1', '2', '3', '4', '5'].join('\n');
  }

  if (inputType === 'status') {
    return ['준비 완료', '진행 중', '완료', '도움 필요'].join('\n');
  }

  if (inputType === 'multi') {
    return ['개념 이해', '실습 진행', '질문 있음', '공유하고 싶음'].join('\n');
  }

  if (inputType === 'choice') {
    return ['처음이에요', '조금 해봤어요', '혼자 할 수 있어요', '친구에게 설명할 수 있어요'].join('\n');
  }

  return '';
}

function hasChoiceOptions(inputType: QuestionInputType) {
  return inputType === 'choice' || inputType === 'multi' || inputType === 'scale' || inputType === 'status';
}

function createDraft(input: Partial<CustomQuestionDraft> = {}): CustomQuestionDraft {
  const inputType = input.inputType ?? 'choice';

  return {
    clientId: nanoid(),
    phase: input.phase ?? 'intro',
    title: input.title ?? '',
    prompt: input.prompt ?? '',
    inputType,
    visibility: input.visibility ?? 'public',
    choicesText: input.choicesText ?? getDefaultChoices(inputType),
    maxLength: input.maxLength ?? 300,
  };
}

function createInitialDrafts(): CustomQuestionDraft[] {
  return [
    createDraft({
      phase: 'intro',
      title: '오늘 주제 경험 체크',
      prompt: '오늘 다룰 도구나 주제를 지금까지 어느 정도 사용해봤나요?',
      inputType: 'choice',
      choicesText: ['처음이에요', '조금 해봤어요', '혼자 할 수 있어요', '친구에게 설명할 수 있어요'].join('\n'),
    }),
    createDraft({
      phase: 'wrapup',
      title: '오늘 배운 것 한 줄 정리',
      prompt: '오늘 가장 기억에 남는 내용이나 다음에 해보고 싶은 것을 적어보세요.',
      inputType: 'text',
      choicesText: '',
      maxLength: 200,
    }),
  ];
}

function normalizeSessionIdInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 64);
}

function parseChoices(choicesText: string) {
  return choicesText
    .split(/[\n,]/)
    .map((choice) => choice.trim())
    .filter(Boolean);
}

function buildSessionLinks(sessionId: string): CreatedSession['links'] {
  return {
    student: buildAppUrl('/student', sessionId),
    admin: buildAppUrl('/admin', sessionId),
    display: buildAppUrl('/display', sessionId),
  };
}

function swapDrafts(drafts: CustomQuestionDraft[], clientId: string, direction: -1 | 1) {
  const currentIndex = drafts.findIndex((draft) => draft.clientId === clientId);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= drafts.length) {
    return drafts;
  }

  const nextDrafts = [...drafts];
  [nextDrafts[currentIndex], nextDrafts[nextIndex]] = [nextDrafts[nextIndex], nextDrafts[currentIndex]];
  return nextDrafts;
}

function toQuestionInput(draft: CustomQuestionDraft): CustomSessionQuestionInput {
  return {
    title: draft.title,
    prompt: draft.prompt,
    inputType: draft.inputType,
    visibility: draft.visibility,
    phase: draft.phase,
    choices: parseChoices(draft.choicesText),
    maxLength: draft.maxLength,
  };
}

type QuestionEditorProps = {
  draft: CustomQuestionDraft;
  index: number;
  canDelete: boolean;
  onPatch: (clientId: string, patch: Partial<CustomQuestionDraft>) => void;
  onDelete: (clientId: string) => void;
  onMove: (clientId: string, direction: -1 | 1) => void;
};

function QuestionEditor({
  draft,
  index,
  canDelete,
  onPatch,
  onDelete,
  onMove,
}: QuestionEditorProps) {
  const handleInputTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const inputType = event.target.value as QuestionInputType;
    const previousDefaultChoices = getDefaultChoices(draft.inputType);
    const shouldReplaceChoices = !draft.choicesText.trim() || draft.choicesText === previousDefaultChoices;

    onPatch(draft.clientId, {
      inputType,
      choicesText: hasChoiceOptions(inputType)
        ? shouldReplaceChoices
          ? getDefaultChoices(inputType)
          : draft.choicesText
        : '',
      maxLength: inputType === 'text' ? draft.maxLength : 300,
    });
  };

  return (
    <div className="builder-interaction-card custom-question-card">
      <div className="builder-interaction-card__header">
        <div className="builder-interaction-card__title-row">
          <span className="builder-interaction-card__index">Q{String(index + 1).padStart(2, '0')}</span>
          <Input
            aria-label={`Q${index + 1} 제목`}
            placeholder="질문 제목"
            value={draft.title}
            onChange={(event) => onPatch(draft.clientId, { title: event.target.value })}
          />
        </div>
        <div className="builder-interaction-card__actions">
          <Button
            aria-label="질문 위로 이동"
            size="sm"
            variant="ghost"
            onClick={() => onMove(draft.clientId, -1)}
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            aria-label="질문 아래로 이동"
            size="sm"
            variant="ghost"
            onClick={() => onMove(draft.clientId, 1)}
          >
            <ArrowDown size={16} />
          </Button>
          <Button
            aria-label="질문 삭제"
            disabled={!canDelete}
            size="sm"
            variant="ghost"
            onClick={() => onDelete(draft.clientId)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="builder-interaction-card__grid">
        <label className="form-field">
          <span className="form-label">수업 구간</span>
          <select
            className="select-sm"
            value={draft.phase}
            onChange={(event) => onPatch(draft.clientId, { phase: event.target.value as LessonPhase })}
          >
            {PHASE_ORDER.map((phase) => (
              <option key={phase} value={phase}>
                {PHASE_LABELS[phase]}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">응답 방식</span>
          <select className="select-sm" value={draft.inputType} onChange={handleInputTypeChange}>
            {(Object.entries(INPUT_TYPE_LABELS) as [QuestionInputType, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="form-hint">{INPUT_TYPE_HELP[draft.inputType]}</span>
        </label>

        <label className="form-field">
          <span className="form-label">결과 공개 범위</span>
          <select
            className="select-sm"
            value={draft.visibility}
            onChange={(event) => onPatch(draft.clientId, { visibility: event.target.value as ResultVisibility })}
          >
            {(Object.entries(VISIBILITY_LABELS) as [ResultVisibility, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="form-hint">{VISIBILITY_HELP[draft.visibility]}</span>
        </label>

        {draft.inputType === 'text' ? (
          <Input
            label="최대 글자 수"
            max={300}
            min={50}
            step={10}
            type="number"
            value={draft.maxLength}
            onChange={(event) =>
              onPatch(draft.clientId, {
                maxLength: Math.max(50, Math.min(300, Number(event.target.value) || 300)),
              })
            }
          />
        ) : null}
      </div>

      <label className="form-field">
        <span className="form-label">질문 문장</span>
        <textarea
          className="textarea"
          placeholder="학생 화면에 그대로 보일 질문을 입력하세요."
          rows={3}
          value={draft.prompt}
          onChange={(event) => onPatch(draft.clientId, { prompt: event.target.value })}
        />
      </label>

      {hasChoiceOptions(draft.inputType) ? (
        <label className="form-field">
          <span className="form-label">선택지</span>
          <textarea
            className="textarea"
            placeholder="학생이 고를 항목을 한 줄에 하나씩 입력하세요."
            rows={4}
            value={draft.choicesText}
            onChange={(event) => onPatch(draft.clientId, { choicesText: event.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
}

function CreatedSessionLinks({
  createdSession,
  onReset,
}: {
  createdSession: CreatedSession;
  onReset: () => void;
}) {
  return (
    <div className="session-result-grid">
      <QrPanel url={createdSession.links.student} />

      <Card className="session-links-card">
        <div className="builder-section-head">
          <div>
            <h3>직접 질문 세션 생성 완료</h3>
            <p>학생에게는 Student QR만 공유하고, 강사는 Admin에서 수업을 진행하세요.</p>
          </div>
          <Badge tone="success">{createdSession.sessionId}</Badge>
        </div>

        <div className="session-link-list">
          <a className="session-link-card" href={buildHashPath('/student', createdSession.sessionId)}>
            <div className="session-link-card__icon">
              <Smartphone size={18} />
            </div>
            <div>
              <strong>Student</strong>
              <p>{createdSession.links.student}</p>
            </div>
            <ExternalLink size={16} />
          </a>

          <a className="session-link-card" href={buildHashPath('/admin', createdSession.sessionId)}>
            <div className="session-link-card__icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong>Admin</strong>
              <p>{createdSession.links.admin}</p>
            </div>
            <ExternalLink size={16} />
          </a>

          <a className="session-link-card" href={buildHashPath('/display', createdSession.sessionId)}>
            <div className="session-link-card__icon">
              <MonitorPlay size={18} />
            </div>
            <div>
              <strong>Display</strong>
              <p>{createdSession.links.display}</p>
            </div>
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="session-links-footer">
          <Link className="builder-link-button" to={`/admin?session=${createdSession.sessionId}`}>
            <Link2 size={16} />
            Admin 열기
          </Link>
          <Button size="sm" variant="ghost" onClick={onReset}>
            <QrCode size={16} />
            새 직접 질문 만들기
          </Button>
        </div>
      </Card>
    </div>
  );
}

function CustomQuestionSessionContent({ ownerUid }: { ownerUid: string }) {
  const { profile } = useUserProfile(ownerUid);
  const [sessionId, setSessionId] = useState(createSessionIdSuggestion);
  const [sessionTitle, setSessionTitle] = useState(DEFAULT_SESSION_TITLE);
  const [startOpen, setStartOpen] = useState(true);
  const [drafts, setDrafts] = useState(createInitialDrafts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);

  const questionSummary = useMemo(() => {
    const publicCount = drafts.filter((draft) => draft.visibility === 'public').length;
    const textCount = drafts.filter((draft) => draft.inputType === 'text').length;
    return {
      publicCount,
      textCount,
      choiceCount: drafts.length - textCount,
    };
  }, [drafts]);

  const handlePatch = (clientId: string, patch: Partial<CustomQuestionDraft>) => {
    setDrafts((current) =>
      current.map((draft) => (draft.clientId === clientId ? { ...draft, ...patch } : draft)),
    );
  };

  const handleAddQuestion = (inputType: QuestionInputType) => {
    setDrafts((current) => [
      ...current,
      createDraft({
        phase: PHASE_ORDER[Math.min(current.length, PHASE_ORDER.length - 1)],
        inputType,
        visibility: inputType === 'status' ? 'teacher-only' : 'public',
      }),
    ]);
  };

  const handleCreate = async () => {
    const normalizedSessionId = normalizeSessionIdInput(sessionId);

    try {
      setBusy(true);
      setError(null);
      setCreatedSession(null);

      await createCustomQuestionSession({
        sessionId: normalizedSessionId,
        title: sessionTitle,
        accepting: startOpen,
        owner: {
          uid: ownerUid,
          organizationId: profile?.organizationId ?? 'dorossaem',
        },
        questions: drafts.map(toQuestionInput),
      });

      setSessionId(normalizedSessionId);
      setCreatedSession({
        sessionId: normalizedSessionId,
        links: buildSessionLinks(normalizedSessionId),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '직접 질문 세션 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setSessionId(createSessionIdSuggestion());
    setSessionTitle(DEFAULT_SESSION_TITLE);
    setStartOpen(true);
    setDrafts(createInitialDrafts());
    setError(null);
    setCreatedSession(null);
  };

  return (
    <div className="session-new-page custom-question-page">
      <div className="custom-session-hero-grid">
        <Card className="session-new-card" tone="accent">
          <div className="builder-section-head">
            <div>
              <h3>1. 수업 링크 만들기</h3>
              <p>sessionId는 학생 링크에 들어가는 짧은 주소입니다. 수업마다 새 ID를 쓰면 응답이 섞이지 않습니다.</p>
            </div>
            <Badge tone="accent">{drafts.length}개 질문</Badge>
          </div>

          <div className="session-new-grid">
            <Input
              hint="영문 소문자, 숫자, -, _만 사용합니다."
              label="sessionId"
              placeholder="예: ai-class-0421"
              value={sessionId}
              onChange={(event) => setSessionId(normalizeSessionIdInput(event.target.value))}
            />
            <Input
              label="세션 제목"
              placeholder="예: AI 도구 실습 1반"
              value={sessionTitle}
              onChange={(event) => setSessionTitle(event.target.value)}
            />
          </div>

          <div className="custom-session-options">
            <label className="builder-checkbox">
              <input
                checked={startOpen}
                type="checkbox"
                onChange={(event) => setStartOpen(event.target.checked)}
              />
              <span>생성 직후 첫 질문 응답 수집 열기</span>
            </label>
            <div className="custom-session-stats">
              <Badge>{questionSummary.choiceCount} 선택형</Badge>
              <Badge>{questionSummary.textCount} 서술형</Badge>
              <Badge tone="success">{questionSummary.publicCount} 공개 가능</Badge>
            </div>
          </div>

          <div className="session-new-actions">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSessionId(createSessionIdSuggestion())}
            >
              ID 다시 만들기
            </Button>
            <Button disabled={busy} onClick={() => void handleCreate()}>
              <PlayCircle size={16} />
              {busy ? '세션 생성 중...' : '학생 QR 생성하기'}
            </Button>
          </div>

          {error ? <div className="inline-message inline-message--error">{error}</div> : null}
        </Card>

        <Card className="custom-session-guide-card">
          <div>
            <Badge tone="success">수업 운영</Badge>
            <h3>생성 후 운영</h3>
          </div>
          <div className="custom-guide-steps">
            <div>
              <strong>1</strong>
              <span>Student QR 공유</span>
            </div>
            <div>
              <strong>2</strong>
              <span>Admin에서 질문 전환</span>
            </div>
            <div>
              <strong>3</strong>
              <span>Display로 공개 결과 보기</span>
            </div>
          </div>
          <p>
            공개 가능 질문은 발표 화면에 보여줄 수 있고, 강사용 질문은 Admin에서만 집계됩니다.
          </p>
        </Card>
      </div>

      <Card className="builder-preset-card custom-question-list-card">
        <div className="builder-section-head">
          <div>
            <h3>2. 질문 구성</h3>
            <p>수업 순서대로 질문을 배치하세요. 첫 번째 질문이 생성 직후 현재 질문이 됩니다.</p>
          </div>
          <div className="custom-question-add-row">
            <Button size="sm" variant="secondary" onClick={() => handleAddQuestion('choice')}>
              <Plus size={16} />
              객관식
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleAddQuestion('text')}>
              <Plus size={16} />
              주관식
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleAddQuestion('status')}>
              <Plus size={16} />
              상태 체크
            </Button>
          </div>
        </div>

        <div className="builder-interaction-list">
          {drafts.map((draft, index) => (
            <QuestionEditor
              canDelete={drafts.length > 1}
              draft={draft}
              index={index}
              key={draft.clientId}
              onDelete={(clientId) => setDrafts((current) => current.filter((item) => item.clientId !== clientId))}
              onMove={(clientId, direction) => setDrafts((current) => swapDrafts(current, clientId, direction))}
              onPatch={handlePatch}
            />
          ))}
        </div>
      </Card>

      {createdSession ? (
        <CreatedSessionLinks createdSession={createdSession} onReset={handleReset} />
      ) : null}
    </div>
  );
}

export function CustomQuestionSessionPage() {
  return (
    <TeacherGate
      compact
      description="오늘 쓸 질문을 직접 입력하면 학생 QR, 강사용 Admin, 발표용 Display 링크가 한 번에 만들어집니다."
      eyebrow="DORO V2"
      title="질문 만들고 바로 공유하기"
      actions={() => (
        <div className="hero-actions">
          <Button size="sm" variant="ghost" onClick={() => { void signOutUser(); }}>
            로그아웃
          </Button>
        </div>
      )}
      loginAside={
        <Card className="banner-card">
          <h3>로그인 후 바로 할 수 있는 일</h3>
          <ul className="flow-list flow-list--bullet">
            <li>질문을 직접 입력해 세션을 만듭니다.</li>
            <li>학생에게 QR을 공유합니다.</li>
            <li>Admin과 Display로 실시간 응답을 봅니다.</li>
          </ul>
        </Card>
      }
    >
      {(user) => <CustomQuestionSessionContent ownerUid={user.uid} />}
    </TeacherGate>
  );
}
