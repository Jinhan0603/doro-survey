import { useLocation } from 'react-router-dom';
import { defaultSessionId } from '../firebase/client';

export function useSessionId() {
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('session')?.trim();

  return sessionId || defaultSessionId;
}
