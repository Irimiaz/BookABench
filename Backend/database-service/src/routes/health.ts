import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const router = Router();

type HealthResponse = {
  timestamp: string;
  uptime: number;
};

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const data: HealthResponse = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
    sendSuccess(res, data, "Server is healthy");
  })
);

export default router;
