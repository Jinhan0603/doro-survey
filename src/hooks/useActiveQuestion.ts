import type { Firestore } from 'firebase/firestore';
import { useQuestions } from './useQuestions';
import { useSession } from './useSession';

// db를 넘기면 세션/질문 구독을 그 Firestore 인스턴스로 수행한다(예: /student는 보조 studentDb).
export function useActiveQuestion(
  sessionId: string,
  { enabled = true, db }: { enabled?: boolean; db?: Firestore } = {},
) {
  const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId, { enabled, db });
  // 세션 문서가 없는 경우 하위 questions 경로를 구독하면 Firestore가 권한 오류를 낸다.
  // 세션을 확인한 뒤에만 질문을 구독해, 삭제됐거나 잘못된 세션 링크를 정상 빈 상태로 처리한다.
  const { questions, loading: questionsLoading, error: questionsError } = useQuestions(sessionId, {
    enabled: enabled && Boolean(session),
    db,
  });

  const activeQuestion = !session?.activeQuestionId
    ? questions[0] ?? null
    : questions.find((question) => question.id === session.activeQuestionId) ?? null;

  return {
    session,
    questions,
    activeQuestion,
    loading: sessionLoading || questionsLoading,
    error: sessionError ?? questionsError,
  };
}
