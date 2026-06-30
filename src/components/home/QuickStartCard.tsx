import { BarChart3, ClipboardList, Monitor, PlayCircle, Plus } from 'lucide-react';
import { usePresenterAuth } from '../../auth/AuthProvider';
import { useMySessions } from '../../hooks/useMySessions';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export function QuickStartCard() {
  // Shows the signed-in presenter's own sessions (newest first). No global
  // default session — each class is owned and listed per teacher.
  const { user } = usePresenterAuth();
  const { sessions } = useMySessions(user?.uid);
  const latest = sessions[0];

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
        <Button variant="purpleOutline" to="/session-new" icon={<PlayCircle size={16} />}>
          수업 열기
        </Button>
      </div>

      {latest ? (
        <div className="dh-qs-inner">
          <div>
            <span className="dh-qs-label">최근 수업</span>
            <p className="dh-qs-class">{latest.title}</p>
            <p className="dh-qs-meta">
              {latest.accepting ? '응답 수집 중' : '대기'} · 내 수업 {sessions.length}개
            </p>
            <p className="dh-qs-code">
              수업 코드<b>{latest.id}</b>
            </p>
            <div className="dh-qs-btns">
              <Button
                variant="blueOutline"
                to={`/admin?session=${latest.id}`}
                icon={<Monitor size={16} />}
              >
                진행 화면
              </Button>
              <Button
                variant="greenOutline"
                to={`/display?session=${latest.id}`}
                icon={<BarChart3 size={16} />}
              >
                결과 화면
              </Button>
              <Button variant="purpleOutline" to="/sessions">
                내 수업 전체
              </Button>
            </div>
          </div>

          <div className="dh-donut" role="img" aria-label={`내 수업 ${sessions.length}개`}>
            <span className="dh-donut-center">{sessions.length}개</span>
          </div>
        </div>
      ) : (
        <div className="dh-qs-inner dh-qs-inner--empty">
          <div>
            <span className="dh-qs-label">내 수업</span>
            <p className="dh-qs-class">아직 만든 수업이 없습니다</p>
            <p className="dh-qs-meta">새 질문을 만들면 여기에서 진행 상황을 확인할 수 있어요.</p>
            <div className="dh-qs-btns">
              <Button variant="blueOutline" to="/custom-session" icon={<Plus size={16} />}>
                새 수업 시작
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
