import { useEffect, useState } from 'react';
import {
  getLessonInteractions,
  getLessonSlides,
  getLessonTemplate,
  subscribeMyLessonTemplates,
  subscribeSharedLessonTemplates,
} from '../firebase/lessonTemplates';
import { firebaseConfigStatus } from '../firebase/client';
import { DEFAULT_ORGANIZATION_ID } from '../firebase/users';
import type { LessonInteractionDoc, LessonSlideDoc, LessonTemplateDoc } from '../firebase/types';

type LibraryState = {
  myTemplates: LessonTemplateDoc[];
  sharedTemplates: LessonTemplateDoc[];
  loading: boolean;
  error: string | null;
};

export function useLessonTemplateLibrary(
  ownerUid: string | null,
  organizationId = DEFAULT_ORGANIZATION_ID,
  enabled = true,
): LibraryState {
  const [state, setState] = useState<LibraryState>({
    myTemplates: [],
    sharedTemplates: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !ownerUid || !firebaseConfigStatus.isConfigured) {
      setState({
        myTemplates: [],
        sharedTemplates: [],
        loading: false,
        error: null,
      });
      return;
    }

    let myLoaded = false;
    let sharedLoaded = false;

    const markLoaded = () => {
      if (myLoaded && sharedLoaded) {
        setState((current) => ({ ...current, loading: false }));
      }
    };

    setState((current) => ({ ...current, loading: true, error: null }));

    const unsubscribeMy = subscribeMyLessonTemplates(ownerUid, (myTemplates) => {
      myLoaded = true;
      setState((current) => ({ ...current, myTemplates, error: null }));
      markLoaded();
    });

    const unsubscribeShared = subscribeSharedLessonTemplates(organizationId, (sharedTemplates) => {
      sharedLoaded = true;
      setState((current) => ({ ...current, sharedTemplates, error: null }));
      markLoaded();
    });

    return () => {
      unsubscribeMy();
      unsubscribeShared.forEach((unsubscribe) => unsubscribe());
    };
  }, [enabled, organizationId, ownerUid]);

  return state;
}

type DetailState = {
  template: LessonTemplateDoc | null;
  slides: LessonSlideDoc[];
  interactions: LessonInteractionDoc[];
  loading: boolean;
  error: string | null;
};

export function useLessonTemplateDetail(templateId: string | undefined, enabled = true): DetailState {
  const [state, setState] = useState<DetailState>({
    template: null,
    slides: [],
    interactions: [],
    loading: Boolean(templateId),
    error: null,
  });

  useEffect(() => {
    if (!enabled || !templateId || !firebaseConfigStatus.isConfigured) {
      setState({
        template: null,
        slides: [],
        interactions: [],
        loading: false,
        error: null,
      });
      return;
    }

    let cancelled = false;
    const currentTemplateId = templateId;

    async function loadTemplateDetail() {
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const [template, slides, interactions] = await Promise.all([
          getLessonTemplate(currentTemplateId),
          getLessonSlides(currentTemplateId),
          getLessonInteractions(currentTemplateId),
        ]);

        if (!cancelled) {
          setState({
            template,
            slides,
            interactions,
            loading: false,
            error: template ? null : '템플릿을 찾을 수 없습니다.',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            template: null,
            slides: [],
            interactions: [],
            loading: false,
            error: error instanceof Error ? error.message : '템플릿을 불러오지 못했습니다.',
          });
        }
      }
    }

    void loadTemplateDetail();

    return () => {
      cancelled = true;
    };
  }, [enabled, templateId]);

  return state;
}
