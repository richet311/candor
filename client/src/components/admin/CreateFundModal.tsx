import { useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { ImageUploadField } from "../ui/ImageUploadField";
import { apiFetch, ApiError } from "../../lib/api";
import { createLogger } from "../../lib/logger";
import { useToast } from "../../context/ToastContext";
import { FUND_CATEGORIES, OTHER_CATEGORY } from "../../lib/fundCategories";

const log = createLogger("create-fund");

export function CreateFundModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(FUND_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [goalDollars, setGoalDollars] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const isOther = category === OTHER_CATEGORY;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch("/funds", {
        method: "POST",
        body: JSON.stringify({
          name,
          category: isOther ? customCategory.trim() : category,
          description,
          goalCents: Math.round(Number(goalDollars) * 100),
          coverImageUrl,
        }),
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
        <Select label="Category" required value={category} onChange={(e) => setCategory(e.target.value)}>
          {FUND_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={OTHER_CATEGORY}>{OTHER_CATEGORY}</option>
        </Select>
        {isOther && (
          <Input
            label="Custom category"
            required
            placeholder="e.g. Infrastructure"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fund-description" className="text-sm font-medium text-[var(--color-ink)]">
            Description
            <span className="text-[var(--color-danger)]" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <textarea
            id="fund-description"
            required
            minLength={10}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10"
          />
        </div>
        <Input label="Goal (USD)" type="number" min={1} step="1" required value={goalDollars} onChange={(e) => setGoalDollars(e.target.value)} />
        <ImageUploadField
          label="Cover image"
          shape="card"
          value={coverImageUrl || null}
          onChange={(url) => setCoverImageUrl(url ?? "")}
          hint="Leave blank and Candor generates cover art from the category."
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create fund
        </Button>
      </form>
    </Modal>
  );
}
