import { useEffect, useMemo, useState } from 'react';
import { firebaseConfigStatus } from '../firebase/client';
import { signInStudentAnonymously } from '../firebase/auth';
import { useActiveQuestion } from '../hooks/useActiveQuestion';
import { useOwnAnswers } from '../hooks/useAnswers';
import { useAuth } from '../hooks/useAuth';
import { useSessionId } from '../hooks/useSessionId';
import { useToasts } from '../hooks/useToasts';
import { normalizeNickname } from '../utils/sanitize';
import { Card } from '../components/common/Card';
import { ToastStack } from '../components/common/Toast';
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
  // /student는 항상 '익명 학생' 컨텍스트여야 한다. 같은 브라우저에 발표자(DoroGate) 세션이
  // 남아 있으면 그 신원이 새어들어와 세션/질문 read가 규칙상 거부된다. 익명일 때만 구독한다.
  const isAnonymousStudent = Boolean(user?.isAnonymous);
  const firestoreEnabled = !authLoading && isAnonymousStudent && Boolean(sessionId);
  const { session, questions, loading, error } = useActiveQuestion(sessionId ?? '', { enabled: firestoreEnabled });
  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);
  const ownAnswers = useOwnAnswers(sessionId ?? '', questionIds, user?.uid);
  const [nickname, setNickname] = useState(getStoredNickname);
  const [nicknameConfirmed, setNicknameConfirmed] = useState(() => getStoredNickname().length > 0);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toasts, pushToast } = useToasts();

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
    if (!liveEnabled || authLoading) return;
    // 이미 익명 학생이면 그대로 둔다.
    if (user?.isAnonymous) return;
    // 사용자가 없거나(신규) 비익명 세션(발표자 잔존)이면 익명 학생으로 (재)로그인한다.
    if (user) {
      console.warn('[auth] /student에 비익명 세션 감지 → 익명 학생으로 전환', { uid: user.uid });
    }
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

    // 설문이 종료되면 학생 화면도 참여를 마감한다.
    if (session.closed) {
      return (
        <WaitingState
          description="참여해 주셔서 감사합니다."
          title="설문이 종료되었습니다"
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

    // 결과가 공개된 상태(응답 열림과 상호배타)면 발표 화면 안내만 띄운다.
    // 결과는 발표 화면(프로젝터) 전용이므로 학생 화면에는 집계를 노출하지 않는다.
    if (session.showResults && session.resultQuestionId) {
      return (
        <WaitingState
          description="앞에 있는 발표 화면에서 결과를 확인하세요."
          title="결과가 공개되었습니다"
        />
      );
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

    // 열린 그 질문의 응답 폼을 표시한다.
    return (
      <LiveQuestionForm
        key={openQuestion.id}
        existingAnswer={ownAnswers[openQuestion.id] ?? null}
        nickname={nickname}
        question={openQuestion}
        sessionId={sessionId}
        uid={user.uid}
        onSubmitted={() => pushToast('답변이 제출되었습니다.', 'success')}
      />
    );
  })();

  return (
    <StudentShell sessionId={sessionId}>
      {liveContent}
      <ToastStack toasts={toasts} />
    </StudentShell>
  );
}
