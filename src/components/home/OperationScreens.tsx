import { ArrowRight } from 'lucide-react';
import { operationCards } from '../../data/homeContent';
import { assetUrl } from '../../utils/urls';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SectionHeader } from './ui/SectionHeader';

export function OperationScreens() {
  return (
    <section className="dh-section" aria-labelledby="dh-op-title">
      <SectionHeader
        className="dh-op-head"
        title="수업 운영 화면"
        description="학생 참여, 교사용 진행, 결과 공유 화면을 한곳에서 엽니다."
      />
      <div className="dh-grid-3">
        {operationCards.map((card) => (
          <Card key={card.title} hover className="dh-op" as="article">
            <div className="dh-op-img">
              <img src={assetUrl(card.image)} alt={card.alt} loading="lazy" />
            </div>
            <div>
              <h3 className="dh-op-title">{card.title}</h3>
              <p className="dh-op-desc">{card.description}</p>
              <Button variant="pillBlue" size="sm" to={card.to}>
                {card.action} <ArrowRight size={15} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
