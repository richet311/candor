import fs from "node:fs";
import path from "node:path";

export const UPLOADS_DIR = path.join(process.cwd(), "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
