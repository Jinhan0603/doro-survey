import type { ReactNode } from 'react';
import { Badge } from '../common/Badge';
import { PageHeader } from './PageHeader';

type AppShellProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  status?: string;
  compact?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  eyebrow,
  title,
  description,
  status,
  compact = false,
  actions,
  children,
}: AppShellProps) {
  const hasHero = title || eyebrow || description || status || actions;

  return (
    <div className="app-shell">
      <PageHeader />
      <main className="app-shell__main">
        {hasHero ? (
          <section className={compact ? 'hero-panel hero-panel--compact' : 'hero-panel'}>
            <div className="hero-panel__copy">
              {eyebrow ? <Badge tone="accent">{eyebrow}</Badge> : null}
              {title ? <h1>{title}</h1> : null}
              {description ? <p>{description}</p> : null}
            </div>
            <div className="hero-panel__aside">
              <div className="hero-panel__meta">
                {status ? <Badge>{status}</Badge> : null}
                {actions}
              </div>
            </div>
          </section>
        ) : null}
        {children}
      </main>
    </div>
  );
}
