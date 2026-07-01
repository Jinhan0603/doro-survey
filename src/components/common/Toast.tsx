import clsx from 'clsx';

export type ToastTone = 'info' | 'success' | 'error';

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastStackProps = {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
};

// 화면 우상단(모바일은 하단)에 쌓이는 자동 소멸 알림. 상태 관리는 useToasts 훅이 담당한다.
export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={clsx('toast', `toast--${toast.tone}`)}>
          <span className="toast__message">{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            aria-label="알림 닫기"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
