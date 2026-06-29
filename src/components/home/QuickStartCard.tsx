import { BarChart3, ClipboardList, Link2, Monitor, Plus } from 'lucide-react';
import { previewSessionId } from '../../data/previewQuestions';
import { CLASS_CODE } from '../../data/homeContent';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export function QuickStartCard() {
  return (
    <Card className="dh-qs">
      <h2 className="dh-qs-title">오늘 수업 시작</h2>
      <p className="dh-qs-desc">질문을 선택하면 학생 참여 링크가 자동으로 생성됩니다.</p>

      <div className="dh-qs-actions">
        <Button variant="blueOutline" to="/custom-session" icon={<Plus size={16} />}>
          새 질문
        </Button>
        <Button variant="greenOutline" to="/library" icon={<ClipboardList size={16} />}>
          템플릿 선택
        </Button>
        <Button variant="purpleOutline" to="/session-new" icon={<Link2 size={16} />}>
          참여 링크 만들기
        </Button>
      </div>

      <div className="dh-qs-inner">
        <div>
          <span className="dh-qs-label">진행 중인 수업</span>
          <p className="dh-qs-class">오늘의 질문 수업</p>
          <p className="dh-qs-meta">참여자 87명 · 응답 64건 · 2분 전 시작</p>
          <p className="dh-qs-code">
            수업 코드<b>{CLASS_CODE}</b>
          </p>
          <div className="dh-qs-btns">
            <Button
              variant="blueOutline"
              to={`/admin?session=${previewSessionId}`}
              icon={<Monitor size={16} />}
            >
              진행 화면
            </Button>
            <Button
              variant="greenOutline"
              to={`/display?session=${previewSessionId}`}
              icon={<BarChart3 size={16} />}
            >
              결과 화면
            </Button>
          </div>
        </div>

        <div
          className="dh-donut"
          role="img"
          aria-label="참여자 87명 응답 현황"
        >
          <span className="dh-donut-center">87명</span>
        </div>
      </div>
    </Card>
  );
}
