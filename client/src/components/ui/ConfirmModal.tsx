import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-[var(--color-ink-soft)]">{message}</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1" disabled={isConfirming}>
            Cancel
          </Button>
          <Button type="button" variant={confirmVariant} onClick={handleConfirm} isLoading={isConfirming} className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
