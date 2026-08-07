import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as statsService from "../services/statsService.js";

const router = Router();

router.get(
  "/impact",
  asyncHandler(async (_req, res) => {
    res.json(await statsService.getPlatformImpactStats());
  }),
);

export default router;
