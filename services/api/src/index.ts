import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { pool } from "./db/pool.js";
import { stationsRouter } from "./stations/routes.js";
import { barriersRouter } from "./barriers/routes.js";
import { routingRouter } from "./routing/routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.use("/stations", stationsRouter);
app.use("/barriers", barriersRouter);
app.use("/", routingRouter);

// Central error handler — every route's `next(err)` lands here so no
// endpoint needs to hand-roll its own error response shape.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: { message: "Invalid request", issues: err.issues } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`BarrierFree API listening on port ${port}`);
});
