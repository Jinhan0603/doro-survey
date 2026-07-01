import { useMemo, useState } from 'react';
import { AdminControls } from './AdminControls';
import { AnswerTable } from './AnswerTable';
import { QrPanel } from './QrPanel';
import { QuestionList } from './QuestionList';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { AppShell } from '../layout/AppShell';
import { defaultSessionId } from '../../firebase/client';
import { previewAnswerRows, previewQuestions } from '../../data/previewQuestions';
import { buildAppUrl } from '../../utils/urls';

export function AdminPreview() {
  const [activeQuestionId, setLocalActiveQuestion] = useState(previewQuestions[1].id);
  const [accepting, setAccepting] = useState(true);
  const [showResults, setShowResults] = useState(false);

  const activeQuestion = previewQuestions.find((q) => q.id === activeQuestionId) ?? previewQuestions[0];
  const studentUrl = useMemo(() => buildAppUrl('/student', defaultSessionId), []);

  return (
    <AppShell
      compact
      actions={
        <div className="hero-actions">
          <Badge>미리보기 모드</Badge>
        </div>
      }
      title="Admin 운영 화면"
    >
      <div className="page-grid page-grid--admin">
        <QuestionList
          activeQuestionId={activeQuestionId}
          questions={previewQuestions}
          onSelect={setLocalActiveQuestion}
          onToggleOpen={() => {}}
        />

        <div className="stack">
          <Card className="status-strip">
            <div className="status-tile">
              <span>현재 응답 수</span>
              <strong>20</strong>
            </div>
            <div className="status-tile">
              <span>수집 상태</span>
              <strong>{accepting ? 'Open' : 'Closed'}</strong>
            </div>
            <div className="status-tile">
              <span>결과 공개</span>
              <strong>{showResults ? 'Visible' : 'Hidden'}</strong>
            </div>
          </Card>

          <AdminControls
            accepting={accepting}
            showResults={showResults}
            onToggleAccepting={() => setAccepting((v) => !v)}
            onToggleResults={() => setShowResults((v) => !v)}
          />

          <Card className="admin-current">
            <div className="section-heading">
              <h3>현재 진행 질문</h3>
              <Badge tone="accent">Q{String(activeQuestion.order).padStart(2, '0')}</Badge>
            </div>
            <strong>{activeQuestion.title}</strong>
            <p>{activeQuestion.prompt}</p>
          </Card>

          <AnswerTable rows={previewAnswerRows} title="실시간 응답 미리보기" />
        </div>

        <div className="stack">
          <QrPanel url={studentUrl} />
          <Card className="metric-panel">
            <div className="metric-panel__row">
              <span>학생 접속 링크</span>
              <strong>QR ready</strong>
            </div>
            <div className="metric-panel__row">
              <span>현재 질문</span>
              <strong>{activeQuestion.id.toUpperCase()}</strong>
            </div>
            <div className="metric-panel__row">
              <span>모드</span>
              <strong>미리보기</strong>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
