import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import type { Fund } from "../lib/types";

const log = createLogger("funds");

export function useFunds() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch<{ funds: Fund[] }>("/funds");
        if (!cancelled) {
          setFunds(data.funds);
          log.info(`loaded ${data.funds.length} funds`);
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
  }, []);

  return { funds, isLoading };
}
