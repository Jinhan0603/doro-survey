import type { ReactNode } from 'react';
import { Badge } from '../common/Badge';
import { PageHeader } from './PageHeader';

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  status?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  eyebrow,
  title,
  description,
  status,
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <PageHeader />
      <main className="app-shell__main">
        <section className="hero-panel">
          <div className="hero-panel__copy">
            <Badge tone="accent">{eyebrow}</Badge>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="hero-panel__aside">
            <div className="hero-panel__meta">
              {status ? <Badge>{status}</Badge> : null}
              {actions}
            </div>
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}
