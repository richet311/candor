import { useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { apiFetch, ApiError } from "../../lib/api";
import { createLogger } from "../../lib/logger";
import { useToast } from "../../context/ToastContext";

const log = createLogger("log-expense");

export function LogExpenseModal({
  fundId,
  fundName,
  onClose,
  onLogged,
}: {
  fundId: string;
  fundName: string;
  onClose: () => void;
  onLogged: () => void;
}) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({ fundId, category, description, amountCents: Math.round(Number(amountDollars) * 100) }),
      });
      log.info("expense logged", { fundId, category });
      toast.success("Expense logged");
      onLogged();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not log expense";
      toast.error(message, err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Log expense for ${fundName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Category" required placeholder="e.g. Materials" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Input label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Amount (USD)" type="number" min={0.01} step="0.01" required value={amountDollars} onChange={(e) => setAmountDollars(e.target.value)} />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Log expense
        </Button>
      </form>
    </Modal>
  );
}
