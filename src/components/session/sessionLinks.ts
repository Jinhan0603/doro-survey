import { buildAppUrl } from '../../utils/urls';

export type CreatedSession = {
  sessionId: string;
  links: {
    student: string;
    admin: string;
    display: string;
  };
};

export function buildSessionLinks(sessionId: string): CreatedSession['links'] {
  return {
    student: buildAppUrl('/student', sessionId),
    admin: buildAppUrl('/admin', sessionId),
    display: buildAppUrl('/display', sessionId),
  };
}
