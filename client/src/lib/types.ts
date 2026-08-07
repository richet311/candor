export type Role = "ADMIN" | "DONOR" | "OWNER";
export type OAuthEvent = "returning" | "linked" | "created";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: Role;
  organizationId: string | null;
  emailVerified: boolean;
}

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ein: string | null;
  sourceUrl: string | null;
  websiteUrl: string | null;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationRequestedAt: string | null;
  verificationRejectionReason: string | null;
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

export interface FundUpdateEntry {
  id: string;
  body: string;
  createdAt: string;
}

export interface FundDetail extends Fund {
  expensesByCategory: ExpenseCategoryTotal[];
  activity: FundActivityEntry[];
  updates: FundUpdateEntry[];
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

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  verified: boolean;
  sourceUrl: string | null;
  fundCount: number;
  raisedCents: number;
  causes: string[];
}

export interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  verified: boolean;
  sourceUrl: string | null;
  createdAt: string;
  raisedCents: number;
  funds: Fund[];
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

export interface PlatformStats {
  totalUsers: number;
  usersByRole: { ADMIN: number; DONOR: number; OWNER: number };
  totalOrganizations: number;
  activeFunds: number;
  inactiveFunds: number;
  totalDonations: number;
  totalDonationVolumeCents: number;
  totalExpensesCents: number;
}

export interface OwnerUserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  isDemoDonor: boolean;
  organization: { name: string; slug: string } | null;
  donationCount: number;
  expenseCount: number;
  createdAt: string;
}

export interface OwnerOrganizationRow {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  ein: string | null;
  fundCount: number;
  memberCount: number;
  createdAt: string;
}

export interface OwnerFundRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  organization: { name: string; slug: string };
  raisedCents: number;
  donationCount: number;
  expenseCount: number;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  name: string;
  slug: string;
  ein: string | null;
  websiteUrl: string | null;
  description: string | null;
  verificationRequestedAt: string;
}

export interface PlatformImpactStats {
  organizationCount: number;
  fundCount: number;
  totalRaisedCents: number;
  totalDonationCount: number;
  totalSpentCents: number;
  byCategory: { category: string; amountCents: number }[];
  topFunds: { id: string; slug: string; name: string; organizationName: string; raisedCents: number }[];
}
