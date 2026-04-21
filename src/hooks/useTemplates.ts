import { useEffect, useState } from 'react';
import { subscribeTemplates } from '../firebase/lessonTemplates';
import { firebaseConfigStatus } from '../firebase/client';
import type { LessonTemplateDoc } from '../firebase/types';

type UseTemplatesResult = {
  templates: LessonTemplateDoc[];
  loading: boolean;
  error: string | null;
};

export function useTemplates({ enabled = true } = {}): UseTemplatesResult {
  const [state, setState] = useState<UseTemplatesResult>({
    templates: [],
    loading: true,
    error: null,
  });

  const shouldSubscribe = enabled && firebaseConfigStatus.isConfigured;

  useEffect(() => {
    if (!shouldSubscribe) {
      setState({ templates: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const unsubscribe = subscribeTemplates(
      (templates) => setState({ templates, loading: false, error: null }),
    );

    return unsubscribe;
  }, [shouldSubscribe]);

  return state;
}
