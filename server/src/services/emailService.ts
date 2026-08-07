import { env } from "../config/env.js";
import { createLogger } from "../lib/logger.js";

const log = createLogger("email");

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Without RESEND_API_KEY configured (or in tests), emails are logged instead of sent so the
// app still runs end-to-end without a real email provider set up. This never throws: a failed
// or unconfigured send shouldn't break the signup/donation flow it's attached to.
export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (env.NODE_ENV === "test" || !env.RESEND_API_KEY) {
    log.info({ to: input.to, subject: input.subject, html: input.html }, "email not sent, no provider configured");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      log.error({ status: res.status, body: await res.text() }, "email provider rejected the request");
    }
  } catch (err) {
    log.error({ err }, "failed to send email");
  }
}

export function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${env.CLIENT_ORIGIN}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Verify your email for Candor",
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Confirm your email address to finish setting up your Candor account and start donating.</p>
      <p><a href="${link}">Verify your email</a></p>
      <p>This link expires in 24 hours. If you didn't create a Candor account, you can ignore this email.</p>
    `,
  });
}

export function sendDonationReceiptEmail(input: {
  to: string;
  name: string;
  amountCents: number;
  fundName: string;
  organizationName: string;
  orgTotalCents: number;
}): Promise<void> {
  return sendEmail({
    to: input.to,
    subject: `Your ${formatCents(input.amountCents)} donation to ${input.organizationName}`,
    html: `
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>Thanks for your donation of <strong>${formatCents(input.amountCents)}</strong> to
      <strong>${escapeHtml(input.fundName)}</strong> at ${escapeHtml(input.organizationName)}.</p>
      <p>You've now given <strong>${formatCents(input.orgTotalCents)}</strong> to ${escapeHtml(input.organizationName)} in total.</p>
      <p>You can see this and every other donation, itemized alongside how each fund spends it, from your dashboard.</p>
    `,
  });
}
