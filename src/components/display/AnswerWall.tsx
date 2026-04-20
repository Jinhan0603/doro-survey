import { Card } from '../common/Card';

type AnswerWallProps = {
  answers: Array<{
    nickname: string;
    answer: string;
  }>;
};

export function AnswerWall({ answers }: AnswerWallProps) {
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
