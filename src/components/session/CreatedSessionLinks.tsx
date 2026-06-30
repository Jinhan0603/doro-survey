import { Link } from 'react-router-dom';
import { ExternalLink, Link2, MonitorPlay, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { QrPanel } from '../admin/QrPanel';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { buildHashPath } from '../../utils/urls';
import type { CreatedSession } from './sessionLinks';

export function CreatedSessionLinks({
  createdSession,
  onReset,
}: {
  createdSession: CreatedSession;
  onReset: () => void;
}) {
  return (
    <div className="session-result-grid">
      <QrPanel url={createdSession.links.student} />

      <Card className="session-links-card">
        <div className="builder-section-head">
          <div>
            <h3>직접 질문 세션 생성 완료</h3>
            <p>학생에게는 Student QR만 공유하고, 강사는 Admin에서 설문을 진행하세요.</p>
          </div>
          <Badge tone="success">{createdSession.sessionId}</Badge>
        </div>

        <div className="session-link-list">
          <a className="session-link-card" href={buildHashPath('/student', createdSession.sessionId)}>
            <div className="session-link-card__icon">
              <Smartphone size={18} />
            </div>
            <div>
              <strong>Student</strong>
              <p>{createdSession.links.student}</p>
            </div>
            <ExternalLink size={16} />
          </a>

          <a className="session-link-card" href={buildHashPath('/admin', createdSession.sessionId)}>
            <div className="session-link-card__icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong>Admin</strong>
              <p>{createdSession.links.admin}</p>
            </div>
            <ExternalLink size={16} />
          </a>

          <a className="session-link-card" href={buildHashPath('/display', createdSession.sessionId)}>
            <div className="session-link-card__icon">
              <MonitorPlay size={18} />
            </div>
            <div>
              <strong>Display</strong>
              <p>{createdSession.links.display}</p>
            </div>
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="session-links-footer">
          <Link className="builder-link-button" to={`/admin?session=${createdSession.sessionId}`}>
            <Link2 size={16} />
            Admin 열기
          </Link>
          <Button size="sm" variant="ghost" onClick={onReset}>
            <QrCode size={16} />
            새 직접 질문 만들기
          </Button>
        </div>
      </Card>
    </div>
  );
}
