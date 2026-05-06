import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardCopy,
  LayoutTemplate,
  MonitorPlay,
  PencilLine,
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

const workflows = [
  {
    href: '/custom-session',
    icon: PencilLine,
    title: '직접 질문 만들기',
    description: '오늘 수업에서 쓸 질문만 입력해 학생 QR, Admin, Display 링크를 바로 만듭니다.',
    badge: '빠른 시작',
    cta: '질문 만들기',
    primary: true,
  },
  {
    href: '/builder',
    icon: LayoutTemplate,
    title: '수업 템플릿 설계',
    description: '도입, 이론, 실습, 윤리, 마무리 흐름으로 반복 수업용 질문 묶음을 설계합니다.',
    badge: '반복 수업',
    cta: '템플릿 만들기',
    primary: false,
  },
  {
    href: '/session-new',
    icon: PlayCircle,
    title: '템플릿으로 세션 열기',
    description: '저장된 템플릿을 실제 live session으로 바꾸고 학생에게 공유할 QR을 생성합니다.',
    badge: '수업 운영',
    cta: '세션 만들기',
    primary: false,
  },
];

const liveScreens = [
  {
    href: buildHashPath('/student', previewSessionId),
    icon: Smartphone,
    title: 'Student',
    description: '학생은 QR로 들어와 닉네임을 입력하고 현재 열린 질문에 답합니다.',
    badge: '학생용',
  },
  {
    href: buildHashPath('/admin', previewSessionId),
    icon: ShieldCheck,
    title: 'Admin',
    description: '강사는 질문 전환, 응답 열기/마감, 결과 공개, 주관식 승인을 진행합니다.',
    badge: '강사용',
  },
  {
    href: buildHashPath('/display', previewSessionId),
    icon: MonitorPlay,
    title: 'Display',
    description: '공개로 설정한 결과만 프로젝터 화면에 크게 보여줍니다.',
    badge: '발표용',
  },
];

const usageSteps = [
  '일회성 수업은 직접 질문 만들기에서 바로 세션을 생성합니다.',
  '반복 수업은 Builder에서 템플릿을 먼저 만들고 Session에서 세션을 생성합니다.',
  '학생에게는 Student QR 또는 링크만 공유합니다.',
  'Admin에서 현재 질문을 선택하고 응답 수집을 엽니다.',
  '응답이 모이면 수집을 마감하고 필요한 질문만 Display에 공개합니다.',
  '결과를 보며 토론한 뒤 다음 질문으로 넘어갑니다.',
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
          <Link className="builder-link-button" to="/custom-session">
            <PencilLine size={16} />
            직접 질문 만들기
          </Link>
          <Link className="builder-link-button builder-link-button--ghost" to="/builder">
            <LayoutTemplate size={16} />
            템플릿 설계
          </Link>
          <Link className="builder-link-button builder-link-button--ghost" to="/session-new">
            <PlayCircle size={16} />
            템플릿 세션 열기
          </Link>
        </div>
      }
      description="질문을 만들고, 학생에게 공유하고, 실시간 응답을 함께 보는 DORO 수업 운영 도구입니다."
      eyebrow="DORO Live Survey V2"
      title="질문 만들기부터 결과 공유까지"
    >
      <div className="stack stack--wide">

        <section className="v2-flow-grid">
          {workflows.map((workflow) => {
            const Icon = workflow.icon;
            return (
              <Card
                key={workflow.title}
                className={workflow.primary ? 'v2-flow-card v2-flow-card--primary' : 'v2-flow-card'}
              >
                <div className="v2-flow-card__top">
                  <div className="feature-card__icon">
                    <Icon size={20} />
                  </div>
                  <Badge tone={workflow.primary ? 'success' : 'accent'}>{workflow.badge}</Badge>
                </div>
                <div className="v2-flow-card__copy">
                  <h3>{workflow.title}</h3>
                  <p>{workflow.description}</p>
                </div>
                <Link className="builder-link-button" to={workflow.href}>
                  {workflow.cta} <ArrowRight size={16} />
                </Link>
              </Card>
            );
          })}
        </section>

        <section className="home-section">
          <div className="home-section__head">
            <div>
              <h2>실시간 운영 화면</h2>
              <p>세션을 만든 뒤에는 이 세 화면만 오가면 됩니다.</p>
            </div>
            <Badge>Live runtime</Badge>
          </div>

          <div className="feature-grid feature-grid--compact">
            {liveScreens.map((screen) => {
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
          </div>
        </section>

        <Card className="share-card">
          <div className="share-card__header">
            <h3>기본 테스트 세션</h3>
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
            새 수업은 직접 질문 만들기 또는 템플릿 세션 열기에서 별도 sessionId로 생성하세요.
          </p>
        </Card>

        <section className="overview-grid">
          <Card className="overview-card">
            <div className="section-heading">
              <h3>운영 흐름</h3>
              <Badge tone="accent">V2</Badge>
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
