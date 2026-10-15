import cors from "cors";
import helmet from "helmet";
import type { CorsOptions } from "cors";
import { env } from "../config/env.js";

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "same-site" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

const corsOptions: CorsOptions = {
  origin: env.CLIENT_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // Any request carrying a bearer token or a JSON body is preflighted, and without a max age
  // browsers only reuse a preflight result for 5 seconds, so nearly every authenticated call
  // paid for an extra OPTIONS round trip first. 2 hours is the most Chromium will honor.
  maxAge: 7200,
};

export const corsMiddleware = cors(corsOptions);
