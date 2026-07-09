import { Router } from "express";
import { z } from "zod";
import { getStationById } from "../stations/repository.js";
import { fetchJourneys } from "./tflClient.js";
import { normalizeJourneys } from "./normalize.js";
import { annotateBarrierFree } from "./barrierFilter.js";

export const routingRouter = Router();

const journeyQuerySchema = z.object({
  from: z.string().uuid(),
  to: z.string().uuid(),
  barrierFree: z
    .string()
    .optional()
    .transform((v) => v !== "false"), // barrier-free filtering is the default/point of the app
});

routingRouter.get("/journeys", async (req, res, next) => {
  try {
    const { from, to, barrierFree } = journeyQuerySchema.parse(req.query);

    const [fromStation, toStation] = await Promise.all([getStationById(from), getStationById(to)]);

    if (!fromStation || !toStation) {
      res.status(404).json({ error: { message: "Origin or destination station not found" } });
      return;
    }

    if (!fromStation.naptanId || !toStation.naptanId) {
      res.status(422).json({
        error: { message: "Origin or destination station is missing a NaPTAN id required for journey planning" },
      });
      return;
    }

    const raw = await fetchJourneys(fromStation.naptanId, toStation.naptanId, {
      appKey: process.env.TFL_APP_KEY,
    });
    const itineraries = normalizeJourneys(raw);
    const annotated = await annotateBarrierFree(itineraries);

    const routes = barrierFree ? annotated.filter((r) => r.isBarrierFree) : annotated;

    res.json({
      barrierFreeModeEnabled: barrierFree,
      routes: routes.map((r) => ({
        durationMinutes: r.itinerary.durationMinutes,
        changes: r.itinerary.changes,
        isBarrierFree: r.isBarrierFree,
        stations: r.touchpoints.map((t) => ({
          stationId: t.stationId,
          name: t.name,
          status: t.status,
          confirmed: t.confirmed,
        })),
        legs: r.itinerary.legs.map((leg) => ({
          mode: leg.mode,
          from: leg.fromStationName,
          to: leg.toStationName,
          durationMinutes: leg.durationMinutes,
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
});
