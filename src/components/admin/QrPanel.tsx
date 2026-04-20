import { QRCodeSVG } from 'qrcode.react';
import { Card } from '../common/Card';

type QrPanelProps = {
  url: string;
};

export function QrPanel({ url }: QrPanelProps) {
  return (
    <Card className="qr-panel" tone="muted">
      <div>
        <h3>학생 입장 QR</h3>
        <p>강의 시작 전에 이 QR만 띄워두면 학생들이 바로 익명으로 입장해 닉네임을 적고 대기할 수 있습니다.</p>
      </div>
      <div className="qr-panel__code">
        <QRCodeSVG bgColor="#ffffff" fgColor="#161513" includeMargin size={128} value={url} />
      </div>
      <code>{url}</code>
    </Card>
  );
}
