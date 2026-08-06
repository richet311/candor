import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../utils/AppError.js";

const client = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!client) throw new UnauthorizedError("Google sign-in isn't configured");

  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  } catch {
    throw new UnauthorizedError("Invalid Google credential");
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new UnauthorizedError("Invalid Google credential");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email,
    emailVerified: payload.email_verified ?? false,
  };
}
