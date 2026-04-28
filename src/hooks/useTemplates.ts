import { useEffect, useState } from 'react';
import { subscribeSharedLessonTemplates } from '../firebase/lessonTemplates';
import { firebaseConfigStatus } from '../firebase/client';
import { DEFAULT_ORGANIZATION_ID } from '../firebase/users';
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

    const unsubscribeList = subscribeSharedLessonTemplates(
      DEFAULT_ORGANIZATION_ID,
      (templates: LessonTemplateDoc[]) => setState({ templates, loading: false, error: null }),
    );

    return () => {
      unsubscribeList.forEach((unsubscribe) => unsubscribe());
    };
  }, [shouldSubscribe]);

  return state;
}
