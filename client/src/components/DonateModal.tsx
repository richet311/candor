import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";

const PRESET_AMOUNTS_CENTS = [2500, 5000, 10000, 25000];

const log = createLogger("donate");

export function DonateModal({ fundId, fundName, onClose }: { fundId: string; fundName: string; onClose: () => void }) {
  const [amountCents, setAmountCents] = useState(PRESET_AMOUNTS_CENTS[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  function selectPreset(value: number) {
    setAmountCents(value);
    setCustomAmount("");
  }

  function handleCustomChange(value: string) {
    setCustomAmount(value);
    const dollars = Number(value);
    if (!Number.isNaN(dollars) && dollars > 0) setAmountCents(Math.round(dollars * 100));
  }

  async function handleDonate() {
    setIsSubmitting(true);
    try {
      log.info("starting checkout", { fundId, amountCents });
      const data = await apiFetch<{ checkoutUrl: string }>("/donations/checkout", {
        method: "POST",
        body: JSON.stringify({ fundId, amountCents }),
      });
      toast.info("Redirecting to Stripe checkout...");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not start checkout";
      toast.error(message, err);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Donate to ${fundName}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS_CENTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectPreset(value)}
              className={`rounded-md border px-2 py-2 text-sm font-medium ${
                amountCents === value && !customAmount
                  ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-ink)]"
              }`}
            >
              ${value / 100}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-ink-soft)]">Custom:</span>
          <div className="flex flex-1 items-center rounded-md border border-[var(--color-border)] px-3 py-1.5">
            <span className="text-sm text-[var(--color-ink-soft)]">$</span>
            <input
              type="number"
              min={1}
              step="1"
              placeholder="Other amount"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-full border-none px-1 text-sm outline-none"
            />
          </div>
        </div>

        <p className="text-xs text-[var(--color-ink-soft)]">
          You'll be redirected to Stripe to complete payment securely. Candor never sees or stores your card details.
        </p>

        <Button onClick={handleDonate} isLoading={isSubmitting} disabled={amountCents < 100} className="w-full">
          Continue to payment
        </Button>
      </div>
    </Modal>
  );
}
