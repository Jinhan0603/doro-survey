import { CheckCircle2 } from 'lucide-react';
import { shareChecks, workflowSteps } from '../../data/homeContent';
import { assetUrl } from '../../utils/urls';
import { Card } from './ui/Card';

export function BottomInfoCards() {
  return (
    <section className="dh-section dh-grid-2" aria-label="수업 운영 안내">
      <Card className="dh-bottom" as="article">
        <h2 className="dh-bottom-title">수업 운영 순서</h2>
        <div className="dh-bottom-inner dh-bottom-inner--steps">
          <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {workflowSteps.map((step, i) => (
              <li className="dh-step" key={step}>
                <span className="dh-step-num">{i + 1}</span>
                <span className="dh-step-text">{step}</span>
              </li>
            ))}
          </ol>
          <div className="dh-bottom-img dh-bottom-img--steps">
            <img src={assetUrl('/images/4.png')} alt="수업 운영 순서를 나타내는 체크리스트 일러스트" loading="lazy" />
          </div>
        </div>
      </Card>

      <Card className="dh-bottom" as="article">
        <h2 className="dh-bottom-title">공유 전 확인하기</h2>
        <div className="dh-bottom-inner dh-bottom-inner--checks">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {shareChecks.map((item) => (
              <li className="dh-check-row" key={item}>
                <CheckCircle2 className="dh-check-ic" size={20} />
                <span className="dh-check-text">{item}</span>
              </li>
            ))}
          </ul>
          <div className="dh-bottom-img dh-bottom-img--checks">
            <img src={assetUrl('/images/5.png')} alt="안전한 공유를 나타내는 방패 체크 일러스트" loading="lazy" />
          </div>
        </div>
      </Card>
    </section>
  );
}
