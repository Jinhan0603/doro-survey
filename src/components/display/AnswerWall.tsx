import { Card } from '../common/Card';

type AnswerWallProps = {
  answers: Array<{
    nickname: string;
    answer: string;
  }>;
};

export function AnswerWall({ answers }: AnswerWallProps) {
  if (answers.length === 0) {
    return (
      <Card className="answer-wall__empty" tone="muted">
        <strong>아직 공개할 답변이 없습니다.</strong>
        <p>관리자 화면에서 승인된 답변을 선택하면 이 영역에 카드로 표시됩니다.</p>
      </Card>
    );
  }

  return (
    <div className="answer-wall">
      {answers.map((answer) => (
        <Card key={`${answer.nickname}-${answer.answer}`} className="answer-wall__card">
          <span>{answer.nickname}</span>
          <p>{answer.answer}</p>
        </Card>
      ))}
    </div>
  );
}
