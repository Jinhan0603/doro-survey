import { useState } from 'react';
import { Check, Copy, QrCode } from 'lucide-react';
import { previewSessionId } from '../../data/previewQuestions';
import { CLASS_CODE } from '../../data/homeContent';
import { buildAppUrl } from '../../utils/urls';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export function ParticipantLinkCard() {
  const [copied, setCopied] = useState(false);
  const studentUrl = buildAppUrl('/student', previewSessionId);
  const displayUrl = `survey.doroedu.co.kr/join/${CLASS_CODE}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(studentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="dh-plink dh-section" as="section">
      <div className="dh-plink-top">
        <h2 className="dh-plink-title">학생 참여 링크</h2>
        <span className="dh-plink-code">
          수업 코드 <b>{CLASS_CODE}</b>
        </span>
      </div>

      <div className="dh-plink-row">
        <span className="dh-url" title={displayUrl}>
          https://{displayUrl}
        </span>
        <Button
          variant="secondary"
          onClick={handleCopy}
          icon={copied ? <Check size={16} /> : <Copy size={16} />}
        >
          {copied ? '복사됨' : '복사'}
        </Button>
        <Button variant="secondary" to={`/admin?session=${previewSessionId}`} icon={<QrCode size={16} />}>
          QR 보기
        </Button>
      </div>

      <p className="dh-plink-help">
        이 링크만 학생에게 공유하세요. 교사용 진행 화면은 공유하지 않습니다.
      </p>
    </Card>
  );
}
