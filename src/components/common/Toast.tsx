import clsx from 'clsx';

export type ToastTone = 'info' | 'success' | 'error';

export type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastStackProps = {
  toasts: ToastItem[];
};

// 화면 중앙 하단에 떠오르는 자동 소멸 알림. 상태 관리·타이머는 useToasts 훅이 담당한다.
export function ToastStack({ toasts }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={clsx('toast', `toast--${toast.tone}`)}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
