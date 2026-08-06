import type { ToastItem } from "../../context/ToastContext";

const STYLES: Record<ToastItem["type"], string> = {
  success: "border-l-4 border-l-[var(--color-success)]",
  error: "border-l-4 border-l-[var(--color-danger)]",
  info: "border-l-4 border-l-[var(--color-navy)]",
};

const ICON: Record<ToastItem["type"], string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-start gap-3 rounded-md bg-[var(--color-paper-raised)] px-4 py-3 shadow-lg ${STYLES[toast.type]}`}
        >
          <span className="mt-0.5 text-sm font-semibold">{ICON[toast.type]}</span>
          <p className="flex-1 text-sm text-[var(--color-ink)]">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
