import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastItem, ToastTone } from '../components/common/Toast';

// 자동 소멸 토스트 알림 상태를 관리한다. pushToast로 띄우고 duration 후 스스로 사라진다.
export function useToasts(duration = 3200) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      idRef.current += 1;
      const id = idRef.current;
      // 토스트는 쌓지 않는다. 기존 토스트/타이머를 정리하고 새 토스트 하나만 표시한다.
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
      setToasts([{ id, message, tone }]);
      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    },
    [dismissToast, duration],
  );

  // 언마운트 시 대기 중인 타이머를 정리한다.
  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return { toasts, pushToast, dismissToast };
}
