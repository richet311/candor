import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import type { OrganizationSummary } from "../lib/types";

const log = createLogger("organizations");

interface OrganizationsResponse {
  organizations: OrganizationSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  causes: string[];
}

export function useOrganizations({ page, limit, search, cause }: { page: number; limit: number; search: string; cause: string }) {
  const [data, setData] = useState<OrganizationsResponse>({
    organizations: [],
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
    causes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search.trim()) params.set("search", search.trim());
        if (cause) params.set("cause", cause);

        const result = await apiFetch<OrganizationsResponse>(`/organizations?${params.toString()}`);
        if (!cancelled) {
          setData(result);
          log.info(`loaded ${result.organizations.length} of ${result.total} organizations`);
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not load organizations";
        toast.error(message, err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, limit, search, cause]);

  return { ...data, isLoading };
}
