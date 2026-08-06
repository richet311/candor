export const AuditAction = {
  AUTH_REGISTER: "auth.register",
  AUTH_LOGIN_SUCCESS: "auth.login_success",
  AUTH_LOGIN_FAILED: "auth.login_failed",
  AUTH_ACCOUNT_LOCKED: "auth.account_locked",
  AUTH_GOOGLE_LOGIN: "auth.google_login",
  AUTH_REFRESH: "auth.refresh",
  AUTH_REFRESH_REUSE_DETECTED: "auth.refresh_reuse_detected",
  AUTH_LOGOUT: "auth.logout",
  FUND_CREATED: "fund.created",
  FUND_UPDATED: "fund.updated",
  EXPENSE_LOGGED: "expense.logged",
  DONATION_INITIATED: "donation.initiated",
  DONATION_SUCCEEDED: "donation.succeeded",
  DONATION_FAILED: "donation.failed",
  WEBHOOK_SIGNATURE_INVALID: "webhook.signature_invalid",
  RATE_LIMIT_EXCEEDED: "security.rate_limit_exceeded",
  AUTHZ_DENIED: "security.authz_denied",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];
