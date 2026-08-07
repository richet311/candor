import { useState, type FormEvent } from "react";
import { Card, CardBody } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { VerifiedCheckIcon } from "../VerifiedBadge";
import { apiFetch, ApiError } from "../../lib/api";
import { createLogger } from "../../lib/logger";
import { useToast } from "../../context/ToastContext";
import type { OrgProfile } from "../../lib/types";

const log = createLogger("verification");

export function VerificationStatusCard({ org, onUpdated }: { org: OrgProfile; onUpdated: () => void }) {
  const [ein, setEin] = useState(org.ein ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch("/organizations/me/verification-request", { method: "POST", body: JSON.stringify({ ein }) });
      log.info("verification requested", { ein });
      toast.success("Verification request submitted");
      onUpdated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not submit verification request";
      toast.error(message, err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (org.verificationStatus === "VERIFIED") {
    return (
      <Card>
        <CardBody className="flex items-center gap-2">
          <span className="text-[var(--color-success)]">
            <VerifiedCheckIcon className="h-5 w-5" />
          </span>
          <p className="text-sm text-[var(--color-ink)]">Your organization is verified against the IRS nonprofit registry.</p>
        </CardBody>
      </Card>
    );
  }

  if (org.verificationStatus === "PENDING") {
    return (
      <Card>
        <CardBody className="flex items-center gap-3">
          <Badge>Pending review</Badge>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Verification request for EIN {org.ein} is awaiting review. We'll show a verified badge once it's approved.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Verify your nonprofit</h3>
          {org.verificationStatus === "REJECTED" && <Badge tone="danger">Not approved</Badge>}
        </div>
        {org.verificationStatus === "REJECTED" && org.verificationRejectionReason && (
          <p className="text-sm text-[var(--color-danger)]">{org.verificationRejectionReason}</p>
        )}
        <p className="text-sm text-[var(--color-ink-soft)]">
          Submit your EIN to request a verified badge. We check it against the IRS nonprofit registry before approving.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input label="EIN" required placeholder="12-3456789" value={ein} onChange={(e) => setEin(e.target.value)} />
          </div>
          <Button type="submit" isLoading={isSubmitting}>
            {org.verificationStatus === "REJECTED" ? "Resubmit" : "Request verification"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
