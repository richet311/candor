import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import type { OrganizationDetail } from "../lib/types";

const log = createLogger("organization-detail");

export function useOrganization(slug: string | undefined) {
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await apiFetch<{ organization: OrganizationDetail }>(`/organizations/${slug}`);
        if (!cancelled) {
          setOrganization(data.organization);
          log.info("loaded organization detail", { slug });
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not load this organization";
        toast.error(message, err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { organization, isLoading };
}
