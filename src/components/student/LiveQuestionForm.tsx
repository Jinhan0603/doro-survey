import { useRef, useState } from 'react';
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
import '../../styles/student-answer.css';

type SubmitState = 'idle' | 'submitting';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
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
  onSubmitted?: () => void;
};

export function LiveQuestionForm({
  question,
  sessionId,
  nickname,
  existingAnswer,
  uid,
  onSubmitted,
}: LiveQuestionFormProps) {
  const [choiceDraft, setChoiceDraft] = useState<string | null>(null);
  const [multiDraft, setMultiDraft] = useState<string[] | null>(null);
  const [textDraft, setTextDraft] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const submittingRef = useRef(false);

  const inputType = getQuestionInputType(question);
  const choices = getQuestionChoices(question);
  const isSubjective = inputType === 'text';
  const isChoice = !isSubjective;
  const allowsMultiple = inputType === 'multi';

  const selectedChoice = choiceDraft ?? (existingAnswer ? getAnswerValue(existingAnswer) : '');
  const selectedChoices = multiDraft ?? (existingAnswer ? getAnswerValues(existingAnswer) : []);
  const textValue = textDraft ?? existingAnswer?.answerText ?? '';

  const isSubmitting = submitState === 'submitting';
  const hasAnswer = Boolean(existingAnswer) || justSubmitted;

  const submitButtonLabel = hasAnswer ? '답변 다시 제출하기' : '답변 제출하기';

  const canSubmit =
    !isSubmitting &&
    (isChoice
      ? allowsMultiple
        ? selectedChoices.length > 0
        : Boolean(selectedChoice)
      : textValue.trim().length > 0);

  const isOptionSelected = (choice: string) =>
    allowsMultiple ? selectedChoices.includes(choice) : choice === selectedChoice;

  const toggleOption = (choice: string) => {
    setSubmitError(null);
    if (!allowsMultiple) {
      setChoiceDraft(choice);
      return;
    }
    setMultiDraft((current) => {
      const base = current ?? selectedChoices;
      return base.includes(choice) ? base.filter((item) => item !== choice) : [...base, choice];
    });
  };

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
          setSubmitError('답변을 선택해주세요.');
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
          setSubmitError('답변을 입력해주세요.');
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

      setSubmitState('idle');
      setJustSubmitted(true);
      onSubmitted?.();
    } catch (nextError) {
      setSubmitState('idle');
      setSubmitError(formatSubmitError(nextError));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <div className="studentAnswerShell">
      <div className="studentAnswerCard">
        <section className="studentQuestionText">
          <h1>{question.title}</h1>
          {question.prompt ? <p>{question.prompt}</p> : null}
        </section>

        {isChoice ? (
          <div className="studentOptionList">
            {choices.map((choice) => {
              const selected = isOptionSelected(choice);
              return (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={selected}
                  className={`studentOptionButton ${selected ? 'isSelected' : ''}`}
                  onClick={() => toggleOption(choice)}
                >
                  <span className="studentOptionIndicator">{selected ? <CheckIcon /> : null}</span>
                  <span className="studentOptionText">{choice}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <label className="studentTextAnswerLabel" htmlFor="studentTextAnswer">
              답변
            </label>
            <textarea
              id="studentTextAnswer"
              className="studentTextAnswer"
              value={textValue}
              maxLength={question.maxLength || 300}
              placeholder="답변을 입력하세요."
              onChange={(event) => {
                setSubmitError(null);
                setTextDraft(event.target.value);
              }}
            />
          </>
        )}

        <footer className="studentSubmitArea">
          {submitError ? <p className="studentErrorNotice">{submitError}</p> : null}
          <button
            type="button"
            className="studentSubmitButton"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitButtonLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
