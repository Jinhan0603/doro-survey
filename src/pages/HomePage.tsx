import { ArrowRight, MonitorPlay, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { AppShell } from '../components/layout/AppShell';
import { previewSessionId } from '../data/previewQuestions';
import { buildHashPath } from '../utils/urls';

const screens = [
  {
    href: buildHashPath('/student', previewSessionId),
    icon: Smartphone,
    title: 'Student',
    description: 'QR로 바로 들어와 닉네임만 적고, 현재 질문에 즉시 응답하는 모바일 화면',
  },
  {
    href: buildHashPath('/admin', previewSessionId),
    icon: ShieldCheck,
    title: 'Admin',
    description: '질문 전환, 응답 마감, 결과 공개, QR 공유를 한 번에 다루는 운영 화면',
  },
  {
    href: buildHashPath('/display', previewSessionId),
    icon: MonitorPlay,
    title: 'Display',
    description: '빔프로젝터용 큰 글씨와 결과 카드 중심으로 정리된 발표 전용 화면',
  },
];

export function HomePage() {
  return (
    <AppShell
      actions={
        <div className="hero-actions">
          <Badge tone="success">lecture MVP</Badge>
          <Link to="/student">
            <Button>학생 화면 보기</Button>
          </Link>
        </div>
      }
      description="로봇 창업 특강을 참여형 수업으로 바꾸기 위한 실시간 질문·퀴즈·토론 시스템입니다. 실제 강의자료 흐름에 맞춰 질문 타이밍과 운영 화면을 함께 다듬고 있습니다."
      eyebrow="DORO Live Survey"
      status="live lecture / Apple-inspired UI"
      title="실제 강의 흐름에 맞춘 실시간 수업 반응 시스템"
    >
      <div className="stack stack--wide">
        <section className="feature-grid">
          {screens.map((screen) => {
            const Icon = screen.icon;

            return (
              <Card key={screen.title} className="feature-card">
                <div className="feature-card__icon">
                  <Icon size={20} />
                </div>
                <h3>{screen.title}</h3>
                <p>{screen.description}</p>
                <a className="feature-card__link" href={screen.href}>
                  Open preview <ArrowRight size={16} />
                </a>
              </Card>
            );
          })}
        </section>

        <section className="overview-grid">
          <Card className="overview-card">
            <div className="section-heading">
              <h3>Architecture</h3>
              <Badge>real-time</Badge>
            </div>
            <ol className="flow-list">
              <li>학생 스마트폰이 QR 링크로 진입합니다.</li>
              <li>GitHub Pages의 정적 앱이 현재 질문을 받아옵니다.</li>
              <li>학생 답변은 Firestore에 저장됩니다.</li>
              <li>Admin과 Display는 같은 세션을 실시간 구독합니다.</li>
            </ol>
          </Card>

          <Card className="overview-card" tone="muted">
            <div className="section-heading">
              <h3>Phase focus</h3>
              <Badge tone="accent">now</Badge>
            </div>
            <ol className="flow-list">
              <li>HashRouter 기반 화면 구조 확정</li>
              <li>Apple-inspired 공용 스타일과 카드 시스템 정리</li>
              <li>학생, Admin, Display 흐름을 실제 수업 기준으로 다듬기</li>
              <li>강의자료 기준 질문 타이밍 최적화</li>
              <li>현장 리허설용 버튼 문구와 운영 흐름 점검</li>
            </ol>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
