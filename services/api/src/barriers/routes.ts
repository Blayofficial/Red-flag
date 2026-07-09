import { Router } from "express";
import { listStationsNeedingReview } from "./repository.js";

export const barriersRouter = Router();

barriersRouter.get("/review-queue", async (_req, res, next) => {
  try {
    const stations = await listStationsNeedingReview();
    res.json({ stations });
  } catch (err) {
    next(err);
  }
});
