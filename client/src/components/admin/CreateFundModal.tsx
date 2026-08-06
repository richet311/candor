import { useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { apiFetch, ApiError } from "../../lib/api";
import { createLogger } from "../../lib/logger";
import { useToast } from "../../context/ToastContext";

const log = createLogger("create-fund");

export function CreateFundModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [goalDollars, setGoalDollars] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch("/funds", {
        method: "POST",
        body: JSON.stringify({ name, category, description, goalCents: Math.round(Number(goalDollars) * 100) }),
      });
      log.info("fund created", { name });
      toast.success(`${name} is live`);
      onCreated();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create fund";
      toast.error(message, err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="New fund" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Fund name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Category" required placeholder="e.g. Infrastructure" value={category} onChange={(e) => setCategory(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fund-description" className="text-sm font-medium text-[var(--color-ink)]">
            Description
          </label>
          <textarea
            id="fund-description"
            required
            minLength={10}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-navy)]"
          />
        </div>
        <Input label="Goal (USD)" type="number" min={1} step="1" required value={goalDollars} onChange={(e) => setGoalDollars(e.target.value)} />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create fund
        </Button>
      </form>
    </Modal>
  );
}
