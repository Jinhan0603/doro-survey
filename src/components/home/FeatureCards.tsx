import { ArrowRight, LayoutTemplate, PencilLine, PlayCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { featureCards } from '../../data/homeContent';
import type { FeatureCard } from '../../data/homeContent';
import { Card } from './ui/Card';
import { IconBadge } from './ui/IconBadge';

const icons: Record<FeatureCard['icon'], ReactNode> = {
  pencil: <PencilLine size={26} />,
  template: <LayoutTemplate size={26} />,
  play: <PlayCircle size={26} />,
};

export function FeatureCards() {
  return (
    <section className="dh-section dh-grid-3" aria-label="주요 기능">
      {featureCards.map((card) => (
        <Card
          key={card.title}
          hover
          className={`dh-feature ${card.emphasized ? 'dh-feature--emph' : ''}`}
          as="article"
        >
          <div>
            <div className="dh-feature-icon">
              <IconBadge icon={icons[card.icon]} tone={card.tone} />
            </div>
            <h3 className="dh-feature-title">{card.title}</h3>
            <p className="dh-feature-desc">{card.description}</p>
          </div>
          <Link className={`dh-feature-link dh-link--${card.tone}`} to={card.to}>
            {card.action} <ArrowRight size={17} />
          </Link>
        </Card>
      ))}
    </section>
  );
}
