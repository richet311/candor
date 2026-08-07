export type Role = "ADMIN" | "DONOR";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: Role;
  organizationId: string | null;
}

export interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ein: string | null;
  sourceUrl: string | null;
  websiteUrl: string | null;
  verified: boolean;
  bannerUrl: string | null;
  logoUrl: string | null;
}

export interface Fund {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  goalCents: number;
  coverImageUrl?: string | null;
  isActive?: boolean;
  organization?: {
    name: string;
    slug: string;
    verified?: boolean;
    sourceUrl?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    websiteUrl?: string | null;
  };
  raisedCents: number;
  spentCents: number;
}

export interface ExpenseCategoryTotal {
  category: string;
  amountCents: number;
}

export type FundActivityEntry =
  | { type: "donation"; id: string; amountCents: number; createdAt: string; isAnonymous: boolean; donorName: string | null }
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

export interface RecentDonation {
  id: string;
  amountCents: number;
  createdAt: string;
  donorName: string | null;
  fund: { name: string; slug: string; organizationName: string };
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
