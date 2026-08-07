import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { OrgAvatar } from "../components/OrgAvatar";
import { CreateFundModal } from "../components/admin/CreateFundModal";
import { LogExpenseModal } from "../components/admin/LogExpenseModal";
import { PostFundUpdateModal } from "../components/admin/PostFundUpdateModal";
import { EditOrgModal } from "../components/admin/EditOrgModal";
import { VerificationStatusCard } from "../components/admin/VerificationStatusCard";
import { AuditLogTable } from "../components/admin/AuditLogTable";
import { apiFetch, ApiError } from "../lib/api";
import { createLogger } from "../lib/logger";
import { useToast } from "../context/ToastContext";
import { formatCents } from "../lib/money";
import type { AuditLogEntry, Fund, OrgProfile } from "../lib/types";

const log = createLogger("admin-dashboard");

export function AdminDashboardPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expenseTarget, setExpenseTarget] = useState<Fund | null>(null);
  const [updateTarget, setUpdateTarget] = useState<Fund | null>(null);
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const [fundsRes, auditRes, orgRes] = await Promise.all([
        apiFetch<{ funds: Fund[] }>("/funds/mine"),
        apiFetch<{ entries: AuditLogEntry[] }>("/audit-log"),
        apiFetch<{ organization: OrgProfile }>("/organizations/me"),
      ]);
      setFunds(fundsRes.funds);
      setAuditEntries(auditRes.entries);
      setOrg(orgRes.organization);
      log.info(`loaded ${fundsRes.funds.length} funds, ${auditRes.entries.length} audit entries`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load the admin dashboard";
      toast.error(message, err);
    } finally {
      setIsLoading(false);
    }
    // toast left out of deps on purpose, see useToast
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalRaised = funds.reduce((sum, f) => sum + f.raisedCents, 0);
  const totalSpent = funds.reduce((sum, f) => sum + f.spentCents, 0);

  if (isLoading) return <Spinner label="Loading admin dashboard" />;

  return (
    <PageContainer className="flex flex-col gap-8">
      {org && (
        <Card>
          {org.bannerUrl && <img src={org.bannerUrl} alt="" className="aspect-[5/1] w-full object-cover" />}
          <CardBody className="flex items-center gap-4">
            <OrgAvatar name={org.name} imageUrl={org.logoUrl} size="lg" />
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-semibold text-[var(--color-ink)]">{org.name}</span>
              {org.description && <p className="text-sm text-[var(--color-ink-soft)]">{org.description}</p>}
            </div>
            <Button variant="ghost" onClick={() => setIsEditingOrg(true)}>
              Edit organization
            </Button>
          </CardBody>
        </Card>
      )}

      {org && <VerificationStatusCard org={org} onUpdated={() => void load()} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Nonprofit dashboard</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">{formatCents(totalRaised)} raised · {formatCents(totalSpent)} spent across {funds.length} funds</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>New fund</Button>
      </div>

      {funds.length === 0 ? (
        <EmptyState
          title="No funds yet"
          description="Create your first fund to start tracking donations and expenses in the open."
          action={<Button onClick={() => setIsCreateOpen(true)}>New fund</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {funds.map((fund) => (
            <Card key={fund.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-[var(--color-ink)]">{fund.name}</h3>
                  <Badge tone={fund.isActive ? "success" : "neutral"}>{fund.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-ink)]">{formatCents(fund.raisedCents)} raised</span>
                  <span className="text-[var(--color-ink-soft)]">{formatCents(fund.spentCents)} spent</span>
                </div>
                <ProgressBar raisedCents={fund.raisedCents} goalCents={fund.goalCents} />
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setExpenseTarget(fund)} className="w-fit">
                    Log expense
                  </Button>
                  <Button variant="ghost" onClick={() => setUpdateTarget(fund)} className="w-fit">
                    Post update
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">Recent activity</h2>
        </CardHeader>
        <CardBody>
          <AuditLogTable entries={auditEntries} />
        </CardBody>
      </Card>

      {isCreateOpen && <CreateFundModal onClose={() => setIsCreateOpen(false)} onCreated={() => void load()} />}
      {expenseTarget && (
        <LogExpenseModal
          fundId={expenseTarget.id}
          fundName={expenseTarget.name}
          onClose={() => setExpenseTarget(null)}
          onLogged={() => void load()}
        />
      )}
      {updateTarget && (
        <PostFundUpdateModal
          fundId={updateTarget.id}
          fundName={updateTarget.name}
          onClose={() => setUpdateTarget(null)}
          onPosted={() => void load()}
        />
      )}
      {isEditingOrg && org && (
        <EditOrgModal org={org} onClose={() => setIsEditingOrg(false)} onUpdated={() => void load()} />
      )}
    </PageContainer>
  );
}
