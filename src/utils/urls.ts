export function buildHashPath(path: string, sessionId: string) {
  return `#${path}?session=${sessionId}`;
}

export function buildAppUrl(path: string, sessionId: string) {
  const origin = typeof window === 'undefined' ? 'http://localhost:5173' : window.location.origin;
  const basePath = typeof window === 'undefined' ? '/doro-survey/' : window.location.pathname || '/doro-survey/';
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;

  return `${origin}${normalizedBase}${buildHashPath(path, sessionId)}`;
}
