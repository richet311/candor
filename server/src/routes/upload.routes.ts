import { Router } from "express";
import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { UPLOADS_DIR } from "../lib/uploadsDir.js";
import { ValidationError } from "../utils/AppError.js";

const router = Router();

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED_MIME_TYPES[file.mimetype]}`),
  }),
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
  (req, res) => {
    if (!req.file) throw new ValidationError("No image file was provided");
    res.status(201).json({ url: `${env.API_ORIGIN}/uploads/${path.basename(req.file.filename)}` });
  },
);

export default router;
