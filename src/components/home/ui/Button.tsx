import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'blueOutline'
  | 'greenOutline'
  | 'purpleOutline'
  | 'pillBlue';

type Props = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  ariaLabel?: string;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  to,
  onClick,
  className = '',
  type = 'button',
  ariaLabel,
}: Props) {
  const cls = `dh-btn dh-btn--${size} dh-btn--${variant} ${className}`.trim();
  const inner = (
    <>
      {icon}
      {children}
    </>
  );
  if (to) {
    return (
      <Link className={cls} to={to} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} type={type} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}
