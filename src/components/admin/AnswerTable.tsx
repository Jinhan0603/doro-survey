import type { ReactNode } from 'react';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

type AnswerRow = {
  id: string;
  nickname: string;
  answer: string;
  statusLabel: string;
  submittedAt: string;
  actions?: ReactNode;
};

type AnswerTableProps = {
  title: string;
  rows: AnswerRow[];
};

export function AnswerTable({ title, rows }: AnswerTableProps) {
  const showActions = rows.some((row) => row.actions);

  return (
    <Card className="answer-table-card">
      <div className="section-heading">
        <h3>{title}</h3>
        <Badge>응답 {rows.length}개</Badge>
      </div>
      <div className="answer-table">
        <div className="answer-table__head">
          <span>닉네임</span>
          <span>답변</span>
          <span>상태</span>
          <span>시간</span>
          {showActions ? <span>조치</span> : null}
        </div>
        {rows.map((row) => (
          <div
            key={row.id}
            className={showActions ? 'answer-table__row answer-table__row--actions' : 'answer-table__row'}
          >
            <span>{row.nickname}</span>
            <strong>{row.answer}</strong>
            <span>{row.statusLabel}</span>
            <span>{row.submittedAt}</span>
            {showActions ? <div className="answer-table__actions">{row.actions}</div> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
