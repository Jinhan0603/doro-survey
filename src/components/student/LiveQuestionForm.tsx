import { type ReactNode, useRef, useState } from 'react';
import { upsertAnswer } from '../../firebase/answers';
import { type AnswerDoc, type QuestionDoc } from '../../firebase/types';
import { normalizeNickname, normalizeTextAnswer } from '../../utils/sanitize';
import {
  getAnswerValue,
  getAnswerValues,
  getQuestionChoices,
  getQuestionInputType,
  resolveChoiceIdByText,
} from '../../utils/questionRuntime';
import { Button } from '../common/Button';
import { ChoiceQuestion } from '../survey/ChoiceQuestion';
import { MultiQuestion } from '../survey/MultiQuestion';
import { QuestionCard } from '../survey/QuestionCard';
import { TextQuestion } from '../survey/TextQuestion';
import { SubmitSuccess } from './SubmitSuccess';

type SubmitState = 'idle' | 'submitting' | 'success';

function buildQuestionCard(question: QuestionDoc, children: ReactNode, footer: ReactNode) {
  return (
    <QuestionCard
      footer={footer}
      prompt={question.prompt}
      stepLabel={`질문 ${String(question.order).padStart(2, '0')}`}
      title={question.title}
    >
      {children}
    </QuestionCard>
  );
}

function isSingleSelectInputType(inputType: ReturnType<typeof getQuestionInputType>) {
  return inputType === 'choice' || inputType === 'scale' || inputType === 'status';
}

function formatSubmitError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('permission-denied')) {
    return '응답 수집이 마감되었거나 현재 질문이 변경되었습니다. 화면을 확인한 뒤 다시 제출해주세요.';
  }

  if (message.includes('unavailable') || message.includes('network')) {
    return '네트워크 연결이 불안정합니다. 잠시 후 다시 제출해주세요.';
  }

  return message || '답변 저장에 실패했습니다.';
}

type LiveQuestionFormProps = {
  question: QuestionDoc;
  sessionId: string;
  nickname: string;
  existingAnswer: AnswerDoc | null;
  uid: string;
};

export function LiveQuestionForm({
  question,
  sessionId,
  nickname,
  existingAnswer,
  uid,
}: LiveQuestionFormProps) {
  const [choiceDraft, setChoiceDraft] = useState<string | null>(null);
  const [multiDraft, setMultiDraft] = useState<string[] | null>(null);
  const [textDraft, setTextDraft] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const submittingRef = useRef(false);
  const inputType = getQuestionInputType(question);
  const choices = getQuestionChoices(question);
  const selectedChoice = choiceDraft ?? (existingAnswer ? getAnswerValue(existingAnswer) : '');
  const selectedChoices = multiDraft ?? (existingAnswer ? getAnswerValues(existingAnswer) : []);
  const textValue = textDraft ?? existingAnswer?.answerText ?? '';

  const handleSubmit = async () => {
    if (submittingRef.current) return;

    const normalizedNickname = normalizeNickname(nickname);
    if (!normalizedNickname) {
      setSubmitError('닉네임을 먼저 입력해주세요.');
      return;
    }

    try {
      submittingRef.current = true;
      setSubmitState('submitting');
      setSubmitError(null);

      if (isSingleSelectInputType(inputType)) {
        const normalizedValue = selectedChoice.trim();
        if (!normalizedValue) {
          setSubmitError('답변을 입력하거나 선택해주세요.');
          setSubmitState('idle');
          return;
        }

        await upsertAnswer({
          sessionId,
          questionId: question.id,
          uid,
          nickname: normalizedNickname,
          answerKind: inputType,
          value: normalizedValue,
          choiceId: resolveChoiceIdByText(question, normalizedValue),
          displayAnswer: normalizedValue,
        });
      } else if (inputType === 'multi') {
        const normalizedValues = selectedChoices.map((item) => item.trim()).filter(Boolean);
        if (normalizedValues.length === 0) {
          setSubmitError('하나 이상 선택해주세요.');
          setSubmitState('idle');
          return;
        }

        const choiceIds = normalizedValues
          .map((item) => resolveChoiceIdByText(question, item))
          .filter((id): id is string => Boolean(id));

        await upsertAnswer({
          sessionId,
          questionId: question.id,
          uid,
          nickname: normalizedNickname,
          answerKind: 'multi',
          values: normalizedValues,
          choiceIds,
          displayAnswer: normalizedValues.join(' | '),
        });
      } else {
        const normalizedValue = normalizeTextAnswer(textValue, question.maxLength || 300);
        if (!normalizedValue) {
          setSubmitError('답변을 입력하거나 선택해주세요.');
          setSubmitState('idle');
          return;
        }

        await upsertAnswer({
          sessionId,
          questionId: question.id,
          uid,
          nickname: normalizedNickname,
          answerKind: 'text',
          value: normalizedValue,
          displayAnswer: normalizedValue,
        });
      }

      setSubmitState('success');
      setShowSuccess(true);
    } catch (nextError) {
      setSubmitState('idle');
      setSubmitError(formatSubmitError(nextError));
    } finally {
      submittingRef.current = false;
    }
  };

  if (showSuccess) {
    return <SubmitSuccess onEdit={() => setShowSuccess(false)} />;
  }

  const isSubmitting = submitState === 'submitting';
  const hasAnswer = Boolean(existingAnswer);

  const footer = (
    <>
      {submitError ? (
        <div className="student-error">{submitError}</div>
      ) : null}
      <Button
        fullWidth
        disabled={isSubmitting || (
          isSingleSelectInputType(inputType)
            ? !selectedChoice
            : inputType === 'multi'
              ? selectedChoices.length === 0
              : !textValue.trim()
        )}
        size="lg"
        onClick={handleSubmit}
      >
        {hasAnswer ? '답변 다시 제출하기' : '이 답변 제출하기'}
      </Button>
      {hasAnswer && !submitError ? (
        <p className="student-already-submitted">이미 제출한 답변이 있습니다. 내용을 바꾸고 다시 누르면 갱신됩니다.</p>
      ) : null}
    </>
  );

  if (inputType === 'choice') {
    return buildQuestionCard(
      question,
      <ChoiceQuestion
        choices={choices}
        selectedChoice={selectedChoice}
        onSelect={(value) => {
          setSubmitError(null);
          setSubmitState('idle');
          setChoiceDraft(value);
        }}
      />,
      footer,
    );
  }

  if (inputType === 'multi') {
    return buildQuestionCard(
      question,
      <MultiQuestion
        choices={choices}
        selectedChoices={selectedChoices}
        onToggle={(value) => {
          setSubmitError(null);
          setSubmitState('idle');
          setMultiDraft((current) => {
            const base = current ?? selectedChoices;
            return base.includes(value)
              ? base.filter((item) => item !== value)
              : [...base, value];
          });
        }}
      />,
      footer,
    );
  }

  if (inputType === 'scale' || inputType === 'status') {
    return buildQuestionCard(
      question,
      <ChoiceQuestion
        choices={choices}
        layout="compact"
        selectedChoice={selectedChoice}
        onSelect={(value) => {
          setSubmitError(null);
          setSubmitState('idle');
          setChoiceDraft(value);
        }}
      />,
      footer,
    );
  }

  return buildQuestionCard(
    question,
    <TextQuestion
      maxLength={question.maxLength || 300}
      value={textValue}
      onChange={(value) => {
        setSubmitError(null);
        setSubmitState('idle');
        setTextDraft(value);
      }}
    />,
    footer,
  );
}
