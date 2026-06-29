import type { ReactNode } from 'react';
import type { Tone } from '../../../data/homeContent';

type Props = {
  icon: ReactNode;
  tone?: Tone;
  size?: number;
};

export function IconBadge({ icon, tone = 'blue', size = 56 }: Props) {
  return (
    <span
      className={`dh-badge dh-badge--${tone}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}
