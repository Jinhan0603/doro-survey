import { BarChart3, FileText, Link2, Monitor, PencilLine } from 'lucide-react';
import { Button } from './ui/Button';
import { QuickStartCard } from './QuickStartCard';

export function HeroSection() {
  return (
    <section className="dh-hero" aria-labelledby="dh-hero-title">
      <div className="dh-hero-deco" aria-hidden="true">
        <span className="b1" />
        <span className="b2" />
        <span className="b3" />
      </div>

      <div className="dh-hero-left">
        <p className="dh-overline">실시간 수업 참여 도구</p>
        <h1 className="dh-headline" id="dh-hero-title">
          질문 만들기부터
          <br />
          결과 공유까지
        </h1>
        <p className="dh-hero-desc">
          수업 중 바로 질문을 만들고,
          <br />
          학생 응답을 실시간으로 확인하세요.
        </p>

        <div className="dh-cta-row">
          <Button variant="primary" size="lg" to="/custom-session" icon={<PencilLine size={18} />}>
            새 질문 만들기
          </Button>
          <Button variant="secondary" size="lg" to="/library" icon={<FileText size={18} />}>
            템플릿으로 시작
          </Button>
        </div>

        <div className="dh-chips">
          <span className="dh-chip dh-chip--green">
            <Link2 size={16} /> 링크·QR 공유
          </span>
          <span className="dh-chip dh-chip--blue">
            <BarChart3 size={16} /> 응답 실시간 확인
          </span>
          <span className="dh-chip dh-chip--purple">
            <Monitor size={16} /> 결과 화면 제공
          </span>
        </div>
      </div>

      <div className="dh-hero-right">
        <QuickStartCard />
      </div>
    </section>
  );
}
