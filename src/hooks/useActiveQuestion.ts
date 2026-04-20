import { useQuestions } from './useQuestions';
import { useSession } from './useSession';

export function useActiveQuestion(sessionId: string) {
  const { session, loading: sessionLoading, error: sessionError } = useSession(sessionId);
  const { questions, loading: questionsLoading, error: questionsError } = useQuestions(sessionId);

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
