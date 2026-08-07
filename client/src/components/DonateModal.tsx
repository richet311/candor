import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import { getPresetAmountsCents } from "../lib/donationPresets";

const log = createLogger("donate");

export function DonateModal({
  fundId,
  fundName,
  fundCategory,
  onClose,
}: {
  fundId: string;
  fundName: string;
  fundCategory?: string | null;
  onClose: () => void;
}) {
  const presetAmountsCents = getPresetAmountsCents(fundCategory);
  const [amountCents, setAmountCents] = useState(presetAmountsCents[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
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
        body: JSON.stringify({ fundId, amountCents, isAnonymous }),
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
          {presetAmountsCents.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectPreset(value)}
              className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors ${
                amountCents === value && !customAmount
                  ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-white"
                  : "border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-navy)]/40"
              }`}
            >
              ${value / 100}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-ink-soft)]">Custom:</span>
          <div className="flex flex-1 items-center rounded-xl border border-[var(--color-border)] px-3.5 py-2">
            <span className="text-sm text-[var(--color-ink-soft)]">$</span>
            <input
              type="number"
              min={1}
              step="0.01"
              placeholder="0.00"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-full border-none px-1 text-sm outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-navy)]"
          />
          Donate anonymously
        </label>
        <p className="-mt-2 text-xs text-[var(--color-ink-soft)]">
          {isAnonymous
            ? "Your name won't be shown on this fund's activity log."
            : "Your name will show on this fund's activity log."}
        </p>

        <p className="text-xs text-[var(--color-ink-soft)]">
          You'll be redirected to Stripe to complete payment securely. Candor never sees or stores your card details,
          and takes no cut, only Stripe's standard processing fee applies.
        </p>

        <Button onClick={handleDonate} isLoading={isSubmitting} disabled={amountCents < 100} className="w-full">
          Continue to payment
        </Button>
      </div>
    </Modal>
  );
}
