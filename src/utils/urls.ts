export function buildHashPath(path: string, sessionId: string) {
  return `#${path}?session=${sessionId}`;
}

/** Resolve a public asset path against the Vite base URL (e.g. /doro-survey/). */
export function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base}${path.replace(/^\//, '')}`;
}

export function buildAppUrl(path: string, sessionId: string) {
  const origin = typeof window === 'undefined' ? 'http://localhost:5173' : window.location.origin;
  const basePath = typeof window === 'undefined' ? '/doro-survey/' : window.location.pathname || '/doro-survey/';
  const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;

  return `${origin}${normalizedBase}${buildHashPath(path, sessionId)}`;
}
