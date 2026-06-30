import { useEffect, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { signInStudentAnonymously } from '../firebase/auth';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useOwnAnswer } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useSessionId } from '../hooks/useSessionId';
import { normalizeNickname } from '../utils/sanitize';
import { Card } from '../components/common/Card';
import { WaitingState } from '../components/survey/WaitingState';
import { LiveQuestionForm } from '../components/student/LiveQuestionForm';
import { NicknameOnboarding } from '../components/student/NicknameOnboarding';
import { StudentPreview } from '../components/student/StudentPreview';
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
  const { session, activeQuestion, loading, error } = useActiveQuestion(sessionId ?? '', { enabled: firestoreEnabled });
  const { answer: existingAnswer, error: ownAnswerError } = useOwnAnswer(sessionId ?? '', activeQuestion?.id, user?.uid);
  const [nickname, setNickname] = useState(getStoredNickname);
  const [nicknameConfirmed, setNicknameConfirmed] = useState(() => getStoredNickname().length > 0);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const liveContent = (() => {
    if (authLoading || loading) {
      return null;
    }

    if (authError || error || ownAnswerError) {
      return (
        <Card className="banner-card banner-card--error">{authError ?? error ?? ownAnswerError}</Card>
      );
    }

    if (!session || !activeQuestion) {
      return (
        <WaitingState
          description="강사님이 질문을 열면 자동으로 표시됩니다."
          title="질문을 기다리는 중입니다"
        />
      );
    }

    if (!session.accepting) {
      return (
        <WaitingState
          description="강사님이 다음 질문을 열면 자동으로 바뀝니다."
          title="답변이 마감되었습니다"
        />
      );
    }

    if (!user) {
      return null;
    }

    return (
      <LiveQuestionForm
        key={activeQuestion.id}
        existingAnswer={existingAnswer}
        nickname={nickname}
        question={activeQuestion}
        sessionId={sessionId}
        uid={user.uid}
      />
    );
  })();

  return (
    <StudentShell sessionId={sessionId}>
      {liveContent}
    </StudentShell>
  );
}
