import { BarChart3, ClipboardList, Link2, Monitor, Plus } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';
import { defaultSessionId } from '../../firebase/client';
import { useSession } from '../../hooks/useSession';
import { useAnswers } from '../../hooks/useAnswers';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

function formatStarted(createdAt?: Timestamp | null): string | null {
  if (!createdAt) return null;
  const diffMin = Math.max(0, Math.floor((Date.now() - createdAt.toMillis()) / 60000));
  if (diffMin < 1) return '방금 시작';
  if (diffMin < 60) return `${diffMin}분 전 시작`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전 시작`;
  return `${Math.floor(diffHour / 24)}일 전 시작`;
}

export function QuickStartCard() {
  const sessionId = defaultSessionId;
  // Live data only resolves for the session owner / admin; anonymous and
  // logged-out visitors get a permission error -> session stays null, so we
  // show a neutral "no running class" state instead of fabricated numbers.
  const { session } = useSession(sessionId);
  const { answers } = useAnswers(sessionId, session?.activeQuestionId);
  const responseCount = answers.length;
  const startedLabel = formatStarted(session?.createdAt);

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

      {session ? (
        <div className="dh-qs-inner">
          <div>
            <span className="dh-qs-label">진행 중인 수업</span>
            <p className="dh-qs-class">{session.title}</p>
            <p className="dh-qs-meta">
              응답 {responseCount}건{startedLabel ? ` · ${startedLabel}` : ''}
            </p>
            <p className="dh-qs-code">
              수업 코드<b>{sessionId}</b>
            </p>
            <div className="dh-qs-btns">
              <Button
                variant="blueOutline"
                to={`/admin?session=${sessionId}`}
                icon={<Monitor size={16} />}
              >
                진행 화면
              </Button>
              <Button
                variant="greenOutline"
                to={`/display?session=${sessionId}`}
                icon={<BarChart3 size={16} />}
              >
                결과 화면
              </Button>
            </div>
          </div>

          <div className="dh-donut" role="img" aria-label={`응답 ${responseCount}건`}>
            <span className="dh-donut-center">{responseCount}건</span>
          </div>
        </div>
      ) : (
        <div className="dh-qs-inner dh-qs-inner--empty">
          <div>
            <span className="dh-qs-label">진행 중인 수업</span>
            <p className="dh-qs-class">진행 중인 수업이 없습니다</p>
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
