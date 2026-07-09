import { Router } from "express";
import { z } from "zod";
import { getStationById, searchStations } from "./repository.js";

export const stationsRouter = Router();

const searchQuerySchema = z.object({
  q: z.string().min(1),
});

stationsRouter.get("/search", async (req, res, next) => {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    const stations = await searchStations(q);
    res.json({ stations });
  } catch (err) {
    next(err);
  }
});

stationsRouter.get("/:id", async (req, res, next) => {
  try {
    const station = await getStationById(req.params.id);
    if (!station) {
      res.status(404).json({ error: { message: "Station not found" } });
      return;
    }
    res.json({ station });
  } catch (err) {
    next(err);
  }
});
