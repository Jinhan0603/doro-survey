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
      </div>
      <div className="qr-panel__code">
        <QRCodeSVG bgColor="#ffffff" fgColor="#161513" includeMargin size={128} value={url} />
      </div>
      <code>{url}</code>
    </Card>
  );
}
