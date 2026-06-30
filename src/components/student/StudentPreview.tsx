import { useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { ChoiceQuestion } from '../survey/ChoiceQuestion';
import { QuestionCard } from '../survey/QuestionCard';
import { TextQuestion } from '../survey/TextQuestion';
import { WaitingState } from '../survey/WaitingState';
import { previewQuestions } from '../../data/previewQuestions';
import { NicknameOnboarding } from './NicknameOnboarding';
import { StudentShell } from './StudentShell';
import { SubmitSuccess } from './SubmitSuccess';

type PreviewMode = 'choice' | 'text' | 'waiting';

export function StudentPreview() {
  const [nickname, setNickname] = useState('');
  const [nicknameConfirmed, setNicknameConfirmed] = useState(false);
  const [choice, setChoice] = useState<string>();
  const [textAnswer, setTextAnswer] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<PreviewMode>('choice');

  const choiceQuestion = previewQuestions[1];
  const textQuestion = previewQuestions[2];

  // useMemo must be called before any conditional returns (Rules of Hooks)
  const questionContent = useMemo(() => {
    if (mode === 'waiting') {
      return (
        <WaitingState
          description="강사님이 다음 질문을 열면 자동으로 바뀝니다."
          title="다음 질문을 기다리는 중입니다"
        />
      );
    }

    if (mode === 'text') {
      return (
        <QuestionCard
          footer={
            <Button fullWidth size="lg" onClick={() => setShowSuccess(true)}>
              답변 제출하기
            </Button>
          }
          prompt={textQuestion.prompt}
          stepLabel={`질문 ${String(textQuestion.order).padStart(2, '0')}`}
          title={textQuestion.title}
        >
          <TextQuestion
            maxLength={textQuestion.maxLength ?? 200}
            value={textAnswer}
            onChange={(value) => setTextAnswer(value)}
          />
        </QuestionCard>
      );
    }

    return (
      <QuestionCard
        footer={
          <Button fullWidth disabled={!choice} size="lg" onClick={() => setShowSuccess(true)}>
            답변 제출하기
          </Button>
        }
        prompt={choiceQuestion.prompt}
        stepLabel={`질문 ${String(choiceQuestion.order).padStart(2, '0')}`}
        title={choiceQuestion.title}
      >
        <ChoiceQuestion
          choices={choiceQuestion.choices ?? []}
          selectedChoice={choice}
          onSelect={(value) => setChoice(value)}
        />
      </QuestionCard>
    );
  }, [
    choice,
    choiceQuestion.choices,
    choiceQuestion.order,
    choiceQuestion.prompt,
    choiceQuestion.title,
    mode,
    textAnswer,
    textQuestion.maxLength,
    textQuestion.order,
    textQuestion.prompt,
    textQuestion.title,
  ]);

  if (!nicknameConfirmed) {
    return (
      <StudentShell isPreview>
        <NicknameOnboarding
          onConfirm={(name) => {
            setNickname(name);
            setNicknameConfirmed(true);
          }}
        />
      </StudentShell>
    );
  }

  const previewBar = (
    <div className="student-preview-bar">
      <span className="student-preview-bar__label">미리보기 · {nickname}</span>
      <div className="student-preview-bar__modes">
        {(['choice', 'text', 'waiting'] as PreviewMode[]).map((m) => (
          <button
            key={m}
            className={`student-preview-bar__btn${mode === m ? ' is-active' : ''}`}
            type="button"
            onClick={() => { setMode(m); setShowSuccess(false); }}
          >
            {m === 'choice' ? '객관식' : m === 'text' ? '주관식' : '대기'}
          </button>
        ))}
      </div>
    </div>
  );

  if (showSuccess) {
    return (
      <StudentShell isPreview>
        {previewBar}
        <SubmitSuccess onEdit={() => setShowSuccess(false)} />
      </StudentShell>
    );
  }

  return (
    <StudentShell isPreview>
      {previewBar}
      {questionContent}
    </StudentShell>
  );
}
