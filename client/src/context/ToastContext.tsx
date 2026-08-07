import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ToastViewport } from "../components/ui/Toast";
import { createLogger } from "../lib/logger";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextValue {
  push: (type: ToastItem["type"], message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const log = createLogger("toast");

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastItem["type"], message: string) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, type, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// Returns a fresh object every render, so callers that use it inside a
// useEffect should leave it out of the dependency array rather than resetting
// the effect on every render; ctx.push itself is stable.
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");

  return {
    success: (message: string, data?: unknown) => {
      log.info(message, data);
      ctx.push("success", message);
    },
    error: (message: string, data?: unknown) => {
      log.error(message, data);
      ctx.push("error", message);
    },
    info: (message: string, data?: unknown) => {
      log.info(message, data);
      ctx.push("info", message);
    },
  };
}
