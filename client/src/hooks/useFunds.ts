import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import type { Fund } from "../lib/types";

const log = createLogger("funds");

interface FundsResponse {
  funds: Fund[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: string[];
  totalRaisedCents: number;
  totalSpentCents: number;
}

const EMPTY: FundsResponse = { funds: [], total: 0, page: 1, limit: 12, totalPages: 1, categories: [], totalRaisedCents: 0, totalSpentCents: 0 };

export function useFunds({ page = 1, limit = 12, search = "", category = "" }: { page?: number; limit?: number; search?: string; category?: string } = {}) {
  const [data, setData] = useState<FundsResponse>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search.trim()) params.set("search", search.trim());
        if (category) params.set("category", category);

        const result = await apiFetch<FundsResponse>(`/funds?${params.toString()}`);
        if (!cancelled) {
          setData(result);
          log.info(`loaded ${result.funds.length} of ${result.total} funds`);
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not load funds";
        toast.error(message, err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, limit, search, category]);

  return { ...data, isLoading };
}
