import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: 'div' | 'section' | 'article';
};

export function Card({ children, className = '', hover = false, as = 'div' }: Props) {
  const Tag = as;
  const cls = `dh-card ${hover ? 'dh-card--hover' : ''} ${className}`.trim();
  return <Tag className={cls}>{children}</Tag>;
}
