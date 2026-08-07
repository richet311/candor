import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { UserAvatar } from "../components/UserAvatar";
import { EditProfileModal } from "../components/EditProfileModal";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { formatCents } from "../lib/money";
import type { Donation } from "../lib/types";

const log = createLogger("donor-dashboard");

const STATUS_TONE = { SUCCEEDED: "success", PENDING: "neutral", FAILED: "danger" } as const;

export function DonorDashboardPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch<{ donations: Donation[] }>("/donations/mine");
        if (!cancelled) {
          setDonations(data.donations);
          log.info(`loaded ${data.donations.length} donations`);
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not load your giving history";
        toast.error(message, err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // toast intentionally omitted: its wrapper identity changes every render,
    // but it always dispatches through the same stable ToastContext.push
  }, []);

  const totalGiven = donations.filter((d) => d.status === "SUCCEEDED").reduce((sum, d) => sum + d.amountCents, 0);

  return (
    <PageContainer className="flex flex-col gap-6">
      {user && (
        <Card>
          <CardBody className="flex items-center gap-4">
            <UserAvatar name={user.name} imageUrl={user.avatarUrl} size="lg" />
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-semibold text-[var(--color-ink)]">{user.name}</span>
              <span className="text-xs text-[var(--color-ink-soft)]">{user.email}</span>
              {user.bio && <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{user.bio}</p>}
            </div>
            <Button variant="ghost" onClick={() => setIsEditingProfile(true)}>
              Edit profile
            </Button>
          </CardBody>
        </Card>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">My donations</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{formatCents(totalGiven)} given across {donations.filter((d) => d.status === "SUCCEEDED").length} donations</p>
      </div>

      {isLoading && <Spinner label="Loading your donations" />}

      {!isLoading && donations.length === 0 && (
        <EmptyState
          title="No donations yet"
          description="Once you donate to a fund, you'll see the receipt and status here."
          action={
            <Link to="/funds">
              <Button variant="secondary">Browse funds</Button>
            </Link>
          }
        />
      )}

      {!isLoading && donations.length > 0 && (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-[var(--color-border)]/60">
              {donations.map((donation) => (
                <li key={donation.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <Link to={`/funds/${donation.fund.slug}`} className="font-medium text-[var(--color-ink)] hover:underline">
                      {donation.fund.name}
                    </Link>
                    <span className="text-xs text-[var(--color-ink-soft)]">{new Date(donation.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS_TONE[donation.status]}>{donation.status}</Badge>
                    <span className="font-medium text-[var(--color-ink)]">{formatCents(donation.amountCents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {isEditingProfile && user && <EditProfileModal user={user} onClose={() => setIsEditingProfile(false)} />}
    </PageContainer>
  );
}
