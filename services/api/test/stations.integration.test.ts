import { afterAll, describe, expect, it } from "vitest";
import { pool } from "../src/db/pool.js";
import { searchStations } from "../src/stations/repository.js";
import { listStationsNeedingReview } from "../src/barriers/repository.js";

// Requires a running Postgres with the seed data loaded (see README:
// `npm run migrate && npm run seed --workspace=services/api`). Skips
// itself if DATABASE_URL isn't set rather than failing CI environments
// that haven't provisioned a database.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb("stations repository (integration)", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("finds a seeded station by partial, case-insensitive name", async () => {
    const results = await searchStations("chiswick");
    expect(results.some((s) => s.name === "Chiswick")).toBe(true);
  });

  it("returns barrier info alongside the station", async () => {
    const [station] = await searchStations("chiswick");
    expect(station.barrier?.status).toBe("OPEN_ACCESS");
  });

  it("flags MIXED and UNKNOWN stations for manual review, not GATED/OPEN_ACCESS ones", async () => {
    const reviewQueue = await listStationsNeedingReview();
    const statuses = new Set(reviewQueue.map((s) => s.status));
    expect(statuses.has("GATED")).toBe(false);
    expect(reviewQueue.some((s) => s.stationName === "Waterloo")).toBe(true);
  });
});
