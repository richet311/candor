import { useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ImageUploadField } from "../ui/ImageUploadField";
import { apiFetch, ApiError } from "../../lib/api";
import { createLogger } from "../../lib/logger";
import { useToast } from "../../context/ToastContext";
import type { OrgProfile } from "../../lib/types";

const log = createLogger("edit-org");

export function EditOrgModal({ org, onClose, onUpdated }: { org: OrgProfile; onClose: () => void; onUpdated: () => void }) {
  const [bannerUrl, setBannerUrl] = useState(org.bannerUrl ?? "");
  const [logoUrl, setLogoUrl] = useState(org.logoUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(org.websiteUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch("/organizations/me", {
        method: "PATCH",
        body: JSON.stringify({ bannerUrl, logoUrl, websiteUrl }),
      });
      log.info("org profile updated");
      toast.success("Organization profile updated");
      onUpdated();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not update your organization";
      toast.error(message, err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Edit organization" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ImageUploadField label="Logo" shape="circle" value={logoUrl || null} onChange={(url) => setLogoUrl(url ?? "")} />
        <ImageUploadField label="Banner" shape="banner" value={bannerUrl || null} onChange={(url) => setBannerUrl(url ?? "")} />
        <Input
          label="Website (optional)"
          type="url"
          placeholder="https://your-org.org"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />
        <p className="-mt-2 text-xs text-[var(--color-ink-soft)]">
          Your org's name links to this from every fund page. Name and description stay as verified at registration.
        </p>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Save changes
        </Button>
      </form>
    </Modal>
  );
}
