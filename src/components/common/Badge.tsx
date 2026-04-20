import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'accent' | 'success';
};

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  return <span className={clsx('badge', `badge--${tone}`, className)} {...props} />;
}
