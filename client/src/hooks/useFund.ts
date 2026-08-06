import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import type { FundDetail } from "../lib/types";

const log = createLogger("fund-detail");

export function useFund(slug: string | undefined) {
  const [fund, setFund] = useState<FundDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const reload = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const data = await apiFetch<{ fund: FundDetail }>(`/funds/${slug}`);
      setFund(data.fund);
      log.info("loaded fund detail", { slug });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load this fund";
      toast.error(message, err);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { fund, isLoading, reload };
}
