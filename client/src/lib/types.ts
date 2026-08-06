export type Role = "ADMIN" | "DONOR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}

export interface Fund {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  goalCents: number;
  isActive?: boolean;
  organization?: { name: string; slug: string };
  raisedCents: number;
  spentCents: number;
}

export interface ExpenseCategoryTotal {
  category: string;
  amountCents: number;
}

export type FundActivityEntry =
  | { type: "donation"; id: string; amountCents: number; createdAt: string }
  | { type: "expense"; id: string; amountCents: number; category: string; description: string; createdAt: string };

export interface FundDetail extends Fund {
  expensesByCategory: ExpenseCategoryTotal[];
  activity: FundActivityEntry[];
}

export interface Donation {
  id: string;
  amountCents: number;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  createdAt: string;
  fund: { name: string; slug: string };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
}
