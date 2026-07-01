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
      console.error('[auth] 학생 익명 로그인 실패', nextError);
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

    // 학생에게 Firebase 원문 에러(예: "Missing or insufficient permissions")를 그대로
    // 노출하지 않는다. 원인은 콘솔에 로깅되고(useAnswers 등 onError), 화면은 차분한 안내만.
    if (authError || error) {
      return (
        <WaitingState
          description="지금은 설문에 연결할 수 없어요. 잠시 후 다시 시도하거나 강사님께 문의해주세요."
          title="잠시 후 다시 시도해주세요"
        />
      );
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

    // 단일-오픈: 지금 응답이 열린 그 질문 하나만 학생에게 노출한다.
    const accepting = session.accepting ?? false;
    const openQuestion = questions.find((question) => (question.open ?? false) && accepting) ?? null;

    if (!openQuestion) {
      return (
        <WaitingState
          description="강사님이 질문을 열면 이곳에 자동으로 표시됩니다."
          title="지금 열린 질문이 없습니다"
        />
      );
    }

    // 결과가 공개되면 학생 화면에는 집계를 띄우지 않는다(개별 답변 노출 방지).
    // 결과는 발표 화면(프로젝터) 전용이므로 앞 화면을 보라고 안내한다.
    if (session.showResults) {
      return (
        <WaitingState
          description="앞에 있는 발표 화면에서 결과를 확인하세요."
          title="결과가 공개되었습니다"
        />
      );
    }

    // 결과 공개 전에는 열린 그 질문의 응답 폼만 표시한다.
    return (
      <LiveQuestionForm
        key={openQuestion.id}
        existingAnswer={ownAnswers[openQuestion.id] ?? null}
        nickname={nickname}
        question={openQuestion}
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
