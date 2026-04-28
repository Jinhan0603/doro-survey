import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCopy,
  LayoutTemplate,
  MonitorPlay,
  PlayCircle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { AppShell } from '../components/layout/AppShell';
import { previewSessionId } from '../data/previewQuestions';
import { buildAppUrl, buildHashPath } from '../utils/urls';

const REAL_SESSION = 'doro-tech-class-2026';

const screens = [
  {
    href: buildHashPath('/student', previewSessionId),
    icon: Smartphone,
    title: '학생 입장하기',
    description: 'QR로 접속한 학생용 화면입니다. 닉네임을 적고 현재 질문에 바로 답합니다.',
    badge: '학생용',
  },
  {
    href: buildHashPath('/admin', previewSessionId),
    icon: ShieldCheck,
    title: '관리자 화면',
    description: '질문 전환, 응답 마감, 결과 공개, 주관식 승인, CSV 다운로드를 한 화면에서 조작합니다.',
    badge: '강사용',
  },
  {
    href: buildHashPath('/display', previewSessionId),
    icon: MonitorPlay,
    title: '발표 화면',
    description: '빔프로젝터에 띄워 학생들과 결과를 함께 보는 화면입니다.',
    badge: '발표용',
  },
  {
    href: '#/library',
    icon: LayoutTemplate,
    title: '템플릿 라이브러리',
    description: 'lesson template을 만들고 복제한 뒤, 실제 수업 session으로 바로 연결합니다.',
    badge: '강사 전용',
  },
];

const usageSteps = [
  'Library 또는 Builder에서 lesson template을 만듭니다. (도입→이론→실습→윤리→마무리)',
  'Session 만들기 화면에서 템플릿 기반 live session을 생성합니다.',
  'Admin 화면에서 관리자 계정으로 로그인합니다.',
  '학생에게 QR 코드 또는 아래 링크를 공유합니다.',
  '질문을 선택하고 응답 수집을 Open으로 둡니다.',
  '답변이 충분히 모이면 Closed로 마감합니다.',
  '결과 공개를 Visible로 바꾸면 Display 화면에 그래프가 나타납니다.',
  'Display 화면을 보며 학생들과 함께 토론하고, 다음 질문으로 넘어갑니다.',
];

const cautions = [
  '학생에게는 학생용 링크만 공유하세요.',
  'Admin 화면은 강사만 사용하고 비밀번호를 노출하지 마세요.',
  'Display 화면은 Admin 로그인 후 같은 브라우저에서 여세요.',
  '새 session을 만들 때는 수업마다 다른 sessionId를 사용하세요.',
];

export function HomePage() {
  const [copied, setCopied] = useState(false);
  const studentUrl = buildAppUrl('/student', REAL_SESSION);

  const handleCopy = () => {
    navigator.clipboard.writeText(studentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Link className="builder-link-button" to="/builder">
            <LayoutTemplate size={16} />
            lesson template 만들기
          </Link>
          <Link className="builder-link-button builder-link-button--ghost" to="/session-new">
            <PlayCircle size={16} />
            세션 만들기
          </Link>
        </div>
      }
      description="학생은 QR로 참여하고, 강사는 Admin에서 흐름을 제어하며, Display 화면으로 결과를 함께 보는 실시간 수업 참여 시스템입니다."
      eyebrow="DORO Live Survey"
      title="실시간 수업 참여 시스템"
    >
      <div className="stack stack--wide">

        {/* 역할별 화면 카드 */}
        <section className="feature-grid">
          {screens.map((screen) => {
            const Icon = screen.icon;
            return (
              <Card key={screen.title} className="feature-card">
                <div className="feature-card__icon-row">
                  <div className="feature-card__icon">
                    <Icon size={20} />
                  </div>
                  <Badge>{screen.badge}</Badge>
                </div>
                <h3>{screen.title}</h3>
                <p>{screen.description}</p>
                <a className="feature-card__link" href={screen.href}>
                  미리보기 열기 <ArrowRight size={16} />
                </a>
              </Card>
            );
          })}
        </section>

        {/* 학생 공유 링크 */}
        <Card className="share-card">
          <div className="share-card__header">
            <h3>학생에게 공유할 링크</h3>
            <Badge tone="success">세션: {REAL_SESSION}</Badge>
          </div>
          <div className="share-card__url">
            <code className="share-card__code">{studentUrl}</code>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              <ClipboardCopy size={15} />
              {copied ? '복사됨!' : '복사'}
            </Button>
          </div>
          <p className="share-card__hint">
            이 링크를 QR로 만들거나 메신저로 공유하면 학생들이 바로 입장할 수 있습니다.
          </p>
        </Card>

        {/* 사용 가이드 */}
        <section className="overview-grid">
          <Card className="overview-card">
            <div className="section-heading">
              <h3>수업 당일 사용 순서</h3>
              <Badge tone="accent">강사 가이드</Badge>
            </div>
            <ol className="flow-list">
              {usageSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Card>

          <Card className="overview-card" tone="muted">
            <div className="section-heading">
              <h3>주의사항</h3>
              <Badge>체크리스트</Badge>
            </div>
            <ul className="flow-list flow-list--bullet">
              {cautions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </section>

      </div>
    </AppShell>
  );
}
