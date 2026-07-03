import type { Firestore } from 'firebase/firestore';
import { useQuestions } from './useQuestions';
import { useSession } from './useSession';

// db를 넘기면 세션/질문 구독을 그 Firestore 인스턴스로 수행한다(예: /student는 보조 studentDb).
export function useActiveQuestion(
  sessionId: string,
  { enabled = true, db }: { enabled?: boolean; db?: Firestore } = {},
) {
  const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId, { enabled, db });
  const { questions, loading: questionsLoading, error: questionsError } = useQuestions(sessionId, { enabled, db });

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
