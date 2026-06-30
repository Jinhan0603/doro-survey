import { useLocation } from 'react-router-dom';

/**
 * Reads the `?session=<id>` param. Returns null when absent — there is no global
 * default session anymore; each class is its own owned session, so callers send
 * presenters to the dashboard (and students to an invalid-link message) instead.
 */
export function useSessionId(): string | null {
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session')?.trim();

  return sessionId || null;
}
