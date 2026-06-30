import { ArrowRight, LayoutTemplate, PencilLine, PlayCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { featureCards } from '../../data/homeContent';
import type { FeatureCard } from '../../data/homeContent';
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
        <Link
          key={card.title}
          to={card.to}
          className={`dh-card dh-card--hover dh-feature ${card.emphasized ? 'dh-feature--emph' : ''}`}
        >
          <div>
            <div className="dh-feature-icon">
              <IconBadge icon={icons[card.icon]} tone={card.tone} />
            </div>
            <h3 className="dh-feature-title">{card.title}</h3>
            <p className="dh-feature-desc">{card.description}</p>
          </div>
          <span className={`dh-feature-link dh-link--${card.tone}`}>
            {card.action} <ArrowRight size={17} />
          </span>
        </Link>
      ))}
    </section>
  );
}
