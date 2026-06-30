import { useState } from 'react';
import { nanoid } from 'nanoid';
import { FileText, ListChecks, QrCode } from 'lucide-react';
import { usePresenterAuth } from '../auth/AuthProvider';
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
import '../styles/survey-builder.css';

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
        visibility: 'public',
      }),
    ]);
  };

  const handleCreate = async () => {
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
    <main className="surveyCreatePage">
      <h1 className="surveyPageTitle">설문 만들기</h1>
      <section className="surveyBuilderPanel">
        <header className="builderPanelHeader">
          <div className="surveyNameField">
            <div className="builderSectionHeading">
              <FileText size={18} />
              <h2>설문지 이름</h2>
            </div>
            <div className="surveyTitleInputWrap">
              <input
                className="surveyTitleInput"
                aria-label="설문지 이름"
                placeholder="설문지 이름을 입력하세요"
                value={sessionTitle}
                onChange={(event) => setSessionTitle(event.target.value)}
              />
            </div>
          </div>

          <div className="questionSectionRow">
            <div className="builderSectionHeading">
              <ListChecks size={18} />
              <h2>질문 구성</h2>
            </div>
            <div className="questionTypeActions">
              <button type="button" className="secondaryPillButton" onClick={() => handleAddQuestion('choice')}>
                + 객관식
              </button>
              <button type="button" className="secondaryPillButton" onClick={() => handleAddQuestion('text')}>
                + 주관식
              </button>
            </div>
          </div>
        </header>

        <div className="builderPanelScrollBody">
          {drafts.length === 0 ? (
            <div className="emptyQuestionState">
              <p className="emptyQuestionTitle">아직 질문이 없습니다</p>
              <p className="emptyQuestionText">객관식, 주관식 질문을 추가해 설문을 구성하세요.</p>
            </div>
          ) : (
            <div className="questionList">
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
          )}

          {createdSession ? (
            <CreatedSessionLinks createdSession={createdSession} onReset={handleReset} />
          ) : null}
        </div>

        <footer className="builderPanelFooter">
          {error ? <span className="builderPanelFooterError">{error}</span> : null}
          <button
            type="button"
            className="primaryQrButton"
            disabled={busy || !sessionTitle.trim() || drafts.length === 0}
            onClick={() => void handleCreate()}
          >
            <QrCode size={18} />
            {busy ? '생성 중...' : '설문 생성하기'}
          </button>
        </footer>
      </section>
    </main>
  );
}

export function CustomQuestionSessionPage() {
  const { user } = usePresenterAuth();
  if (!user) {
    return null;
  }
  return <CustomQuestionSessionContent ownerUid={user.uid} />;
}
