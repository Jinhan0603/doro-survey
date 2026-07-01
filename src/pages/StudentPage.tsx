import { useEffect, useMemo, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { signInStudentAnonymously } from '../firebase/auth';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useOwnAnswers } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useSessionId } from '../hooks/useSessionId';
import { normalizeNickname } from '../utils/sanitize';
import { Card } from '../components/common/Card';
import { WaitingState } from '../components/survey/WaitingState';
import { LiveQuestionForm } from '../components/student/LiveQuestionForm';
import { NicknameOnboarding } from '../components/student/NicknameOnboarding';
import { StudentPreview } from '../components/student/StudentPreview';
import { StudentQuestionList } from '../components/student/StudentQuestionList';
import { StudentShell } from '../components/student/StudentShell';

const NICKNAME_STORAGE_KEY = 'doro-live-survey.nickname';

function getStoredNickname() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? '';
}

export function StudentPage() {
  const sessionId = useSessionId();
  const liveEnabled = firebaseConfigStatus.isConfigured;
  const { user, loading: authLoading } = useAuth();
  // Wait for auth before subscribing to Firestore — Firestore rules require isSignedIn()
  const firestoreEnabled = !authLoading && !!user && Boolean(sessionId);
  const { session, questions, loading, error } = useActiveQuestion(sessionId ?? '', { enabled: firestoreEnabled });
  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);
  const ownAnswers = useOwnAnswers(sessionId ?? '', questionIds, user?.uid);
  const [nickname, setNickname] = useState(getStoredNickname);
  const [nicknameConfirmed, setNicknameConfirmed] = useState(() => getStoredNickname().length > 0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextValue = normalizeNickname(nickname);
    if (nextValue) {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, nextValue);
    } else {
      window.localStorage.removeItem(NICKNAME_STORAGE_KEY);
    }
  }, [nickname]);

  useEffect(() => {
    if (!liveEnabled || authLoading || user) return;
    signInStudentAnonymously().catch((nextError) => {
      setAuthError(nextError instanceof Error ? nextError.message : '학생 로그인에 실패했습니다.');
    });
  }, [authLoading, liveEnabled, user]);

  if (!liveEnabled) {
    return <StudentPreview />;
  }

  if (!sessionId) {
    return (
      <StudentShell>
        <Card className="banner-card banner-card--error">
          유효하지 않은 참여 링크입니다. 강사님이 공유한 링크로 다시 접속해주세요.
        </Card>
      </StudentShell>
    );
  }

  const handleConfirmNickname = (name: string) => {
    setNickname(name);
    setNicknameConfirmed(true);
  };

  if (!nicknameConfirmed) {
    return (
      <StudentShell sessionId={sessionId}>
        <NicknameOnboarding onConfirm={handleConfirmNickname} />
      </StudentShell>
    );
  }

  const selectedQuestion = selectedQuestionId
    ? questions.find((question) => question.id === selectedQuestionId) ?? null
    : null;

  const liveContent = (() => {
    if (authLoading || loading) {
      return null;
    }

    if (authError || error) {
      return <Card className="banner-card banner-card--error">{authError ?? error}</Card>;
    }

    if (!session) {
      return (
        <WaitingState
          description="강사님이 세션을 준비하면 자동으로 표시됩니다."
          title="질문을 기다리는 중입니다"
        />
      );
    }

    if (questions.length === 0) {
      return (
        <WaitingState
          description="강사님이 질문을 준비 중입니다. 잠시만 기다려주세요."
          title="아직 등록된 질문이 없습니다"
        />
      );
    }

    if (!user) {
      return null;
    }

    // 답변 뷰: 목록에서 고른 질문. 실시간으로 닫히면 안내로 전환한다.
    if (selectedQuestion) {
      const isOpen = (selectedQuestion.open ?? false) && (session.accepting ?? false);
      return (
        <div className="student-answer-view">
          <button
            type="button"
            className="student-back"
            onClick={() => setSelectedQuestionId(null)}
          >
            ← 질문 목록으로
          </button>
          {isOpen ? (
            <LiveQuestionForm
              key={selectedQuestion.id}
              existingAnswer={ownAnswers[selectedQuestion.id] ?? null}
              nickname={nickname}
              question={selectedQuestion}
              sessionId={sessionId}
              uid={user.uid}
            />
          ) : (
            <WaitingState
              description="강사님이 이 질문을 다시 열면 답변할 수 있습니다."
              title="지금은 닫힌 질문입니다"
            />
          )}
        </div>
      );
    }

    // 목록 뷰: 지금 응답 수집 중(질문 open && 세션 accepting)인 질문만 동적으로 보여준다.
    // 강사가 응답을 마감하면 해당 질문은 목록에서 사라진다.
    const accepting = session.accepting ?? false;
    const openQuestions = questions.filter((question) => (question.open ?? false) && accepting);

    if (openQuestions.length === 0) {
      return (
        <WaitingState
          description="강사님이 질문을 열면 이곳에 자동으로 표시됩니다."
          title="지금 열린 질문이 없습니다"
        />
      );
    }

    return (
      <StudentQuestionList
        accepting={accepting}
        ownAnswers={ownAnswers}
        questions={openQuestions}
        onSelect={(questionId) => setSelectedQuestionId(questionId)}
      />
    );
  })();

  return (
    <StudentShell sessionId={sessionId}>
      {liveContent}
    </StudentShell>
  );
}
