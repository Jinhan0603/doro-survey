import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { FileText, ListChecks, QrCode, Save } from 'lucide-react';
import { usePresenterAuth } from '../auth/AuthProvider';
import { QuestionEditor } from '../components/session/QuestionEditor';
import {
  createDraft,
  createDraftFromQuestion,
  createInitialDrafts,
  swapDrafts,
  toQuestionInput,
  type CustomQuestionDraft,
} from '../components/session/customQuestionDraft';
import { PHASE_ORDER } from '../data/lessonTemplatePresets';
import { createCustomQuestionSession, updateCustomQuestionSession } from '../firebase/sessions';
import type { QuestionInputType } from '../firebase/types';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useLessonTemplateDetail } from '../hooks/useLessonTemplatesData';
import { useUserProfile } from '../hooks/useUserProfile';
import '../styles/survey-builder.css';

function createSessionIdSuggestion() {
  return `live-${nanoid(6).toLowerCase()}`;
}

function CustomQuestionSessionContent({ ownerUid }: { ownerUid: string }) {
  const navigate = useNavigate();
  const { profile } = useUserProfile(ownerUid);
  const [searchParams] = useSearchParams();
  const { sessionId: editSessionId } = useParams();
  const isEditMode = Boolean(editSessionId);
  const templateId = searchParams.get('template')?.trim() || undefined;
  const { template, interactions: templateInteractions } = useLessonTemplateDetail(templateId);
  const hydratedTemplateRef = useRef<string | null>(null);

  // 편집 모드: 기존 세션의 제목/질문을 불러와 폼을 채운다(응답 보존을 위해 질문 ID 유지).
  const {
    session: editingSession,
    questions: editingQuestions,
    loading: editLoading,
    error: editLoadError,
  } = useActiveQuestion(editSessionId ?? '', { enabled: isEditMode });
  const hydratedSessionRef = useRef<string | null>(null);

  const [sessionTitle, setSessionTitle] = useState('');
  const [drafts, setDrafts] = useState(createInitialDrafts);
  const [hydrated, setHydrated] = useState(!isEditMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드 진입 시 기존 세션 데이터를 한 번만 폼에 반영한다(이후 실시간 변경으로 덮어쓰지 않음).
  useEffect(() => {
    if (
      !isEditMode ||
      !editSessionId ||
      editLoading ||
      !editingSession ||
      hydratedSessionRef.current === editSessionId
    ) {
      return;
    }
    hydratedSessionRef.current = editSessionId;
    setSessionTitle(editingSession.title ?? '');
    setDrafts(
      [...editingQuestions]
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        .map(createDraftFromQuestion),
    );
    setHydrated(true);
  }, [isEditMode, editSessionId, editLoading, editingSession, editingQuestions]);

  // '템플릿으로 설문 제작'으로 진입(?template=)하면 템플릿 내용을 질문 목록에 채운다.
  useEffect(() => {
    if (isEditMode || !templateId || !template || hydratedTemplateRef.current === templateId) {
      return;
    }
    hydratedTemplateRef.current = templateId;
    setSessionTitle(template.title ?? '');
    setDrafts(
      [...templateInteractions]
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        .map((interaction) =>
          createDraft({
            phase: interaction.phase,
            title: interaction.title,
            prompt: interaction.prompt,
            inputType: interaction.inputType,
            visibility: interaction.visibility,
            choicesText: (interaction.choices ?? []).join('\n'),
            maxLength: interaction.maxLength ?? 300,
          }),
        ),
    );
  }, [isEditMode, templateId, template, templateInteractions]);

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

  const handleSubmit = async () => {
    try {
      setBusy(true);
      setError(null);

      const targetSessionId = isEditMode && editSessionId ? editSessionId : createSessionIdSuggestion();

      if (isEditMode && editSessionId) {
        await updateCustomQuestionSession({
          sessionId: editSessionId,
          title: sessionTitle.trim(),
          questions: drafts.map(toQuestionInput),
        });
      } else {
        await createCustomQuestionSession({
          sessionId: targetSessionId,
          title: sessionTitle.trim(),
          accepting: true,
          owner: {
            uid: ownerUid,
            organizationId: profile?.organizationId ?? 'dorossaem',
          },
          questions: drafts.map(toQuestionInput),
        });
      }

      // 저장 후 진행 중인 설문으로 이동하고 해당 설문을 선택한다.
      navigate(`/sessions?selected=${targetSessionId}`);
    } catch (nextError) {
      const fallback = isEditMode ? '설문 수정에 실패했습니다.' : '직접 질문 세션 생성에 실패했습니다.';
      setError(nextError instanceof Error ? nextError.message : fallback);
      setBusy(false);
    }
  };

  // 편집 모드에서 세션 로딩/조회 실패 상태를 먼저 처리한다.
  if (isEditMode && !hydrated) {
    const notFound = !editLoading && !editingSession;
    return (
      <main className="surveyCreatePage">
        <h1 className="surveyPageTitle">설문 편집</h1>
        <section className="surveyBuilderPanel">
          <div className="builderPanelScrollBody">
            <div className="emptyQuestionState">
              <p className="emptyQuestionTitle">
                {editLoadError || notFound ? '설문을 불러올 수 없습니다' : '설문을 불러오는 중입니다…'}
              </p>
              {editLoadError || notFound ? (
                <p className="emptyQuestionText">
                  {editLoadError ?? '요청한 설문이 없거나 접근 권한이 없습니다.'}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="surveyCreatePage">
      <h1 className="surveyPageTitle">{isEditMode ? '설문 편집' : '설문 만들기'}</h1>
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
                  canDelete={!draft.questionId}
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
        </div>

        <footer className="builderPanelFooter">
          {error ? <span className="builderPanelFooterError">{error}</span> : null}
          <button
            type="button"
            className="primaryQrButton"
            disabled={busy || !sessionTitle.trim() || drafts.length === 0}
            onClick={() => void handleSubmit()}
          >
            {isEditMode ? <Save size={18} /> : <QrCode size={18} />}
            {isEditMode ? '저장' : '설문 생성하기'}
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
