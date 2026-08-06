import { PrismaClient } from "../../generated/client/index.js";
import { isProd } from "../config/env.js";

export const prisma = new PrismaClient({
  log: isProd ? ["error"] : ["error", "warn"],
});
