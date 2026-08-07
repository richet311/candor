import { useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { apiFetch, ApiError } from "../../lib/api";
import { createLogger } from "../../lib/logger";
import { useToast } from "../../context/ToastContext";

const log = createLogger("post-fund-update");

export function PostFundUpdateModal({
  fundId,
  fundName,
  onClose,
  onPosted,
}: {
  fundId: string;
  fundName: string;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch("/fund-updates", { method: "POST", body: JSON.stringify({ fundId, body }) });
      log.info("fund update posted", { fundId });
      toast.success("Update posted");
      onPosted();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not post update";
      toast.error(message, err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Post an update for ${fundName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="update-body" className="text-sm font-medium text-[var(--color-ink)]">
            What's new
            <span className="text-[var(--color-danger)]" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <textarea
            id="update-body"
            required
            minLength={3}
            maxLength={2000}
            rows={5}
            placeholder="e.g. This week we funded 200 meals with the first round of donations."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10"
          />
          <p className="text-xs text-[var(--color-ink-soft)]">Shown to donors on the fund's public page, newest first.</p>
        </div>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Post update
        </Button>
      </form>
    </Modal>
  );
}
