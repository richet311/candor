import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Spinner } from "../components/ui/Spinner";
import { Pagination } from "../components/ui/Pagination";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { EmptyState } from "../components/ui/EmptyState";
import { apiFetch, ApiError } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatCents } from "../lib/money";
import type { PlatformStats, OwnerUserRow, OwnerOrganizationRow, OwnerFundRow, VerificationRequest } from "../lib/types";

const LIMIT = 15;
const TABS = ["Users", "Organizations", "Funds", "Verification"] as const;
type Tab = (typeof TABS)[number];

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-sm rounded-full border border-[var(--color-border)] px-4 py-2 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10"
    />
  );
}

export function OwnerDashboardPage() {
  const [tab, setTab] = useState<Tab>("Users");
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const toast = useToast();

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch<PlatformStats>("/owner/stats");
      setStats(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load platform stats";
      toast.error(message, err);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Owner dashboard</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">Platform-wide visibility across every account, organization, and fund.</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Users" value={String(stats.totalUsers)} hint={`${stats.usersByRole.DONOR} donors · ${stats.usersByRole.ADMIN} org staff`} />
          <StatCard label="Organizations" value={String(stats.totalOrganizations)} />
          <StatCard label="Funds" value={String(stats.activeFunds)} hint={`${stats.inactiveFunds} inactive`} />
          <StatCard label="Donation volume" value={formatCents(stats.totalDonationVolumeCents)} hint={`${stats.totalDonations} donations`} />
        </div>
      )}

      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              tab === t ? "border-[var(--color-navy)] text-[var(--color-navy)]" : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Users" && <UsersTab onMutated={loadStats} />}
      {tab === "Organizations" && <OrganizationsTab onMutated={loadStats} />}
      {tab === "Funds" && <FundsTab onMutated={loadStats} />}
      {tab === "Verification" && <VerificationTab onMutated={loadStats} />}
    </PageContainer>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</span>
        <span className="text-2xl font-bold text-[var(--color-ink)]">{value}</span>
        {hint && <span className="text-xs text-[var(--color-ink-soft)]">{hint}</span>}
      </CardBody>
    </Card>
  );
}

function UsersTab({ onMutated }: { onMutated: () => void }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [rows, setRows] = useState<OwnerUserRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<OwnerUserRow | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search.trim()) qs.set("search", search.trim());
      const data = await apiFetch<{ users: OwnerUserRow[]; total: number; totalPages: number }>(`/owner/users?${qs.toString()}`);
      setRows(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load users";
      toast.error(message, err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await apiFetch<void>(`/owner/users/${pendingDelete.id}`, { method: "DELETE" });
      toast.success(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      void load();
      onMutated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not delete this user";
      toast.error(message, err);
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by name or email" />
      {isLoading && <Spinner label="Loading users" />}
      {!isLoading && rows.length === 0 && <EmptyState title="No users found" description="Try a different search." />}
      {!isLoading && rows.length > 0 && (
        <>
          <p className="text-xs text-[var(--color-ink-soft)]">{total} users</p>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-black/[0.02] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Organization</th>
                  <th className="px-4 py-2.5 font-medium">Activity</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-ink)]">
                          {u.name} {u.isDemoDonor && <span className="text-xs font-normal text-[var(--color-ink-soft)]">(demo)</span>}
                        </span>
                        <span className="text-xs text-[var(--color-ink-soft)]">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={u.role === "OWNER" ? "accent" : "neutral"}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{u.organization?.name ?? "-"}</td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                      {u.donationCount} donations · {u.expenseCount} expenses
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {u.role !== "OWNER" && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(u)}
                          className="text-xs font-semibold text-[var(--color-danger)] hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
      {pendingDelete && (
        <ConfirmModal
          title="Delete this user?"
          message={`This permanently deletes ${pendingDelete.name} (${pendingDelete.email}). This can't be undone. Accounts with any donation or expense history are refused automatically to protect the public ledger.`}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function OrganizationsTab({ onMutated }: { onMutated: () => void }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [rows, setRows] = useState<OwnerOrganizationRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<OwnerOrganizationRow | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search.trim()) qs.set("search", search.trim());
      const data = await apiFetch<{ organizations: OwnerOrganizationRow[]; total: number; totalPages: number }>(
        `/owner/organizations?${qs.toString()}`,
      );
      setRows(data.organizations);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load organizations";
      toast.error(message, err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await apiFetch<void>(`/owner/organizations/${pendingDelete.id}`, { method: "DELETE" });
      toast.success(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      void load();
      onMutated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not delete this organization";
      toast.error(message, err);
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search organizations by name" />
      {isLoading && <Spinner label="Loading organizations" />}
      {!isLoading && rows.length === 0 && <EmptyState title="No organizations found" description="Try a different search." />}
      {!isLoading && rows.length > 0 && (
        <>
          <p className="text-xs text-[var(--color-ink-soft)]">{total} organizations</p>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-black/[0.02] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Verified</th>
                  <th className="px-4 py-2.5 font-medium">Funds</th>
                  <th className="px-4 py-2.5 font-medium">Staff</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-ink)]">{o.name}</span>
                        <span className="text-xs text-[var(--color-ink-soft)]">{o.ein ?? "no EIN on file"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{o.verified ? <Badge tone="success">Verified</Badge> : <Badge>Unverified</Badge>}</td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{o.fundCount}</td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{o.memberCount}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setPendingDelete(o)}
                        className="text-xs font-semibold text-[var(--color-danger)] hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
      {pendingDelete && (
        <ConfirmModal
          title="Delete this organization?"
          message={`This permanently deletes ${pendingDelete.name}, including any funds and expenses that don't have real donations attached. This can't be undone. Organizations with donation history or remaining staff accounts are refused automatically.`}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function FundsTab({ onMutated }: { onMutated: () => void }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);
  const [rows, setRows] = useState<OwnerFundRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<OwnerFundRow | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search.trim()) qs.set("search", search.trim());
      const data = await apiFetch<{ funds: OwnerFundRow[]; total: number; totalPages: number }>(`/owner/funds?${qs.toString()}`);
      setRows(data.funds);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load funds";
      toast.error(message, err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await apiFetch<void>(`/owner/funds/${pendingDelete.id}`, { method: "DELETE" });
      toast.success(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      void load();
      onMutated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not delete this fund";
      toast.error(message, err);
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search funds by name" />
      {isLoading && <Spinner label="Loading funds" />}
      {!isLoading && rows.length === 0 && <EmptyState title="No funds found" description="Try a different search." />}
      {!isLoading && rows.length > 0 && (
        <>
          <p className="text-xs text-[var(--color-ink-soft)]">{total} funds</p>
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-black/[0.02] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                  <th className="px-4 py-2.5 font-medium">Fund</th>
                  <th className="px-4 py-2.5 font-medium">Organization</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Raised</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--color-ink)]">{f.name}</span>
                        <span className="text-xs text-[var(--color-ink-soft)]">{f.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">{f.organization.name}</td>
                    <td className="px-4 py-2.5">{f.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</td>
                    <td className="px-4 py-2.5 text-[var(--color-ink-soft)]">
                      {formatCents(f.raisedCents)} · {f.donationCount} donations
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setPendingDelete(f)}
                        className="text-xs font-semibold text-[var(--color-danger)] hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
      {pendingDelete && (
        <ConfirmModal
          title="Delete this fund?"
          message={`This permanently deletes ${pendingDelete.name} and its logged expenses. This can't be undone. Funds with any donation history are refused automatically to protect the public ledger.`}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

function VerificationTab({ onMutated }: { onMutated: () => void }) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingApprove, setPendingApprove] = useState<VerificationRequest | null>(null);
  const [pendingReject, setPendingReject] = useState<VerificationRequest | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ requests: VerificationRequest[] }>("/owner/verification-requests");
      setRequests(data.requests);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load verification requests";
      toast.error(message, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove() {
    if (!pendingApprove) return;
    try {
      await apiFetch(`/owner/verification-requests/${pendingApprove.id}/approve`, { method: "POST" });
      toast.success(`${pendingApprove.name} approved`);
      setPendingApprove(null);
      void load();
      onMutated();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not approve this request";
      toast.error(message, err);
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading && <Spinner label="Loading verification requests" />}
      {!isLoading && requests.length === 0 && (
        <EmptyState title="No pending requests" description="Verification requests submitted by organizations will show up here." />
      )}
      {!isLoading && requests.length > 0 && (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-[var(--color-ink)]">{r.name}</span>
                  <span className="text-xs text-[var(--color-ink-soft)]">
                    EIN {r.ein} · requested {new Date(r.verificationRequestedAt).toLocaleDateString()}
                  </span>
                  {r.websiteUrl && (
                    <a href={r.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-accent)] hover:underline">
                      {r.websiteUrl}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPendingReject(r)}>
                    Reject
                  </Button>
                  <Button onClick={() => setPendingApprove(r)}>Approve</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {pendingApprove && (
        <ConfirmModal
          title="Approve this organization?"
          message={`${pendingApprove.name} will get a verified badge, checked against EIN ${pendingApprove.ein}.`}
          confirmLabel="Approve"
          confirmVariant="primary"
          onConfirm={handleApprove}
          onCancel={() => setPendingApprove(null)}
        />
      )}
      {pendingReject && (
        <RejectVerificationModal
          request={pendingReject}
          onClose={() => setPendingReject(null)}
          onRejected={() => {
            void load();
            onMutated();
          }}
        />
      )}
    </div>
  );
}

function RejectVerificationModal({
  request,
  onClose,
  onRejected,
}: {
  request: VerificationRequest;
  onClose: () => void;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiFetch(`/owner/verification-requests/${request.id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
      toast.success(`${request.name} rejected`);
      onRejected();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not reject this request";
      toast.error(message, err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Reject verification for ${request.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reject-reason" className="text-sm font-medium text-[var(--color-ink)]">
            Reason
            <span className="text-[var(--color-danger)]" aria-hidden="true">
              {" "}
              *
            </span>
          </label>
          <textarea
            id="reject-reason"
            required
            minLength={3}
            maxLength={500}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-navy)] focus:ring-2 focus:ring-[var(--color-navy)]/10"
          />
          <p className="text-xs text-[var(--color-ink-soft)]">Shown to the organization so they know what to fix before resubmitting.</p>
        </div>
        <Button type="submit" variant="danger" isLoading={isSubmitting} className="w-full">
          Reject
        </Button>
      </form>
    </Modal>
  );
}
