import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { AppShell } from '../components/layout/AppShell';

export function NotFoundPage() {
  return (
    <AppShell
      description="해시 라우트 기반 구조라 경로가 달라지면 이 화면으로 들어옵니다."
      eyebrow="404"
      status="route not found"
      title="요청한 화면을 찾지 못했습니다"
    >
      <Card className="not-found-card">
        <p>학생, Admin, Display 중 하나의 경로로 다시 진입해주세요.</p>
        <Link to="/">
          <Button>홈으로 돌아가기</Button>
        </Link>
      </Card>
    </AppShell>
  );
}
