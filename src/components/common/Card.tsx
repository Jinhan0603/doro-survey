import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'muted' | 'accent';
};

export function Card({ className, tone = 'default', ...props }: CardProps) {
  return <div className={clsx('card', `card--${tone}`, className)} {...props} />;
}
