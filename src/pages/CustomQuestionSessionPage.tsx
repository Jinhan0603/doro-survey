import { useState } from 'react';
import { nanoid } from 'nanoid';
import { PlayCircle, Plus } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { TeacherGate } from '../components/teacher/TeacherGate';
import { CreatedSessionLinks } from '../components/session/CreatedSessionLinks';
import { buildSessionLinks, type CreatedSession } from '../components/session/sessionLinks';
import { QuestionEditor } from '../components/session/QuestionEditor';
import {
  createDraft,
  createInitialDrafts,
  swapDrafts,
  toQuestionInput,
  type CustomQuestionDraft,
} from '../components/session/customQuestionDraft';
import { PHASE_ORDER } from '../data/lessonTemplatePresets';
import { createCustomQuestionSession } from '../firebase/sessions';
import type { QuestionInputType } from '../firebase/types';
import { useUserProfile } from '../hooks/useUserProfile';

function createSessionIdSuggestion() {
  return `live-${nanoid(6).toLowerCase()}`;
}

function CustomQuestionSessionContent({ ownerUid }: { ownerUid: string }) {
  const { profile } = useUserProfile(ownerUid);
  const [sessionTitle, setSessionTitle] = useState('');
  const [drafts, setDrafts] = useState(createInitialDrafts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSession, setCreatedSession] = useState<CreatedSession | null>(null);

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
    if (!sessionTitle.trim()) {
      setError('설문지 이름을 입력하세요.');
      return;
    }

    const newSessionId = createSessionIdSuggestion();

    try {
      setBusy(true);
      setError(null);
      setCreatedSession(null);

      await createCustomQuestionSession({
        sessionId: newSessionId,
        title: sessionTitle.trim(),
        accepting: true,
        owner: {
          uid: ownerUid,
          organizationId: profile?.organizationId ?? 'dorossaem',
        },
        questions: drafts.map(toQuestionInput),
      });

      setCreatedSession({
        sessionId: newSessionId,
        links: buildSessionLinks(newSessionId),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '직접 질문 세션 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setSessionTitle('');
    setDrafts(createInitialDrafts());
    setError(null);
    setCreatedSession(null);
  };

  return (
    <div className="session-new-page custom-question-page">
      <Card className="session-new-card" tone="accent">
        <div className="session-new-grid">
          <Input
            aria-label="설문지 이름"
            placeholder="설문지 이름을 입력하세요 (예: AI 도구 실습 1반)"
            value={sessionTitle}
            onChange={(event) => setSessionTitle(event.target.value)}
          />
        </div>

        <div className="builder-section-head">
          <div>
            <h3>질문 구성</h3>
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
              canDelete
              draft={draft}
              index={index}
              key={draft.clientId}
              onDelete={(clientId) => setDrafts((current) => current.filter((item) => item.clientId !== clientId))}
              onMove={(clientId, direction) => setDrafts((current) => swapDrafts(current, clientId, direction))}
              onPatch={handlePatch}
            />
          ))}
        </div>

        <div className="session-new-actions">
          <Button disabled={busy || drafts.length === 0} onClick={() => void handleCreate()}>
            <PlayCircle size={16} />
            {busy ? '세션 생성 중...' : '학생 QR 생성하기'}
          </Button>
        </div>

        {error ? <div className="inline-message inline-message--error">{error}</div> : null}
      </Card>

      {createdSession ? (
        <CreatedSessionLinks createdSession={createdSession} onReset={handleReset} />
      ) : null}
    </div>
  );
}

export function CustomQuestionSessionPage() {
  return (
    <TeacherGate compact>
      {(user) => <CustomQuestionSessionContent ownerUid={user.uid} />}
    </TeacherGate>
  );
}
