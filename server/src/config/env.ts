import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  API_ORIGIN: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  // trim(): these get sent verbatim as an HTTP Authorization header (Stripe SDK) or used
  // to verify a signature byte-for-byte (webhook secret) - a stray copy-pasted newline or
  // trailing space breaks both in ways that are painful to trace back to the env var.
  STRIPE_SECRET_KEY: z.string().trim().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1, "STRIPE_WEBHOOK_SECRET is required"),

  GOOGLE_CLIENT_ID: z.string().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Optional: without this, verification/receipt emails are logged instead of sent,
  // so the app still runs end-to-end without a real email provider configured.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Candor <onboarding@resend.dev>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

// Tests truncate tables between runs (see __tests__/helpers.ts), so they need their own
// database, otherwise `npm test` wipes out whatever real data the dev server was serving.
if (env.NODE_ENV === "test") {
  env.DATABASE_URL = env.DATABASE_URL.replace(/\/([a-zA-Z0-9_-]+)(\?.*)?$/, "/$1_test$2");
  process.env.DATABASE_URL = env.DATABASE_URL;
}
