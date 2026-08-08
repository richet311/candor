import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env } from "../config/env.js";
import { UPLOADS_DIR } from "../lib/uploadsDir.js";
import { isR2Configured, uploadToR2 } from "../lib/r2.js";
import { ValidationError } from "../utils/AppError.js";

const router = Router();

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Buffered in memory rather than streamed to disk: R2 needs the bytes as a Buffer to upload,
// and the local-disk path below writes from that same buffer, so one storage engine covers both.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(new ValidationError("Only JPEG, PNG, WebP, or GIF images are allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post(
  "/image",
  requireAuth,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        next(new ValidationError(err.code === "LIMIT_FILE_SIZE" ? "Image must be under 5MB" : err.message));
        return;
      }
      next(err);
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ValidationError("No image file was provided");
    const filename = `${crypto.randomUUID()}${ALLOWED_MIME_TYPES[req.file.mimetype]}`;

    if (isR2Configured) {
      const url = await uploadToR2(filename, req.file.buffer, req.file.mimetype);
      res.status(201).json({ url });
      return;
    }

    // Local dev fallback only. Render's filesystem is ephemeral, so production requires R2
    // to be configured - see the superRefine in config/env.ts, which enforces that at boot.
    await fs.writeFile(path.join(UPLOADS_DIR, filename), req.file.buffer);
    res.status(201).json({ url: `${env.API_ORIGIN}/uploads/${filename}` });
  }),
);

export default router;
