import { describe, expect, it, vi } from "vitest";
import type { Itinerary } from "../src/routing/normalize.js";

vi.mock("../src/barriers/repository.js", () => ({
  getBarrierStatusByNaptanIds: vi.fn(async (naptanIds: string[]) => {
    const known: Record<string, { status: string; confidenceScore: number }> = {
      OPEN_A: { status: "OPEN_ACCESS", confidenceScore: 0.95 },
      OPEN_B: { status: "OPEN_ACCESS", confidenceScore: 0.9 },
      GATED_X: { status: "GATED", confidenceScore: 0.85 },
    };
    return new Map(naptanIds.filter((id) => id in known).map((id) => [id, known[id]]));
  }),
}));

const { annotateBarrierFree } = await import("../src/routing/barrierFilter.js");

function itineraryWithStops(stops: Array<{ name: string; naptanId: string | null }>): Itinerary {
  const legs = stops.slice(0, -1).map((from, i) => ({
    mode: "overground",
    fromStationName: from.name,
    fromNaptanId: from.naptanId,
    toStationName: stops[i + 1].name,
    toNaptanId: stops[i + 1].naptanId,
    durationMinutes: 10,
  }));
  return { durationMinutes: legs.length * 10, changes: Math.max(legs.length - 1, 0), legs };
}

describe("annotateBarrierFree", () => {
  it("confirms a route where every touchpoint is OPEN_ACCESS", async () => {
    const itinerary = itineraryWithStops([
      { name: "A", naptanId: "OPEN_A" },
      { name: "B", naptanId: "OPEN_B" },
    ]);

    const [result] = await annotateBarrierFree([itinerary]);
    expect(result.isBarrierFree).toBe(true);
    expect(result.touchpoints.every((t) => t.confirmed)).toBe(true);
  });

  it("excludes a route with a GATED touchpoint", async () => {
    const itinerary = itineraryWithStops([
      { name: "A", naptanId: "OPEN_A" },
      { name: "X", naptanId: "GATED_X" },
    ]);

    const [result] = await annotateBarrierFree([itinerary]);
    expect(result.isBarrierFree).toBe(false);
  });

  it("excludes a route with an UNKNOWN touchpoint rather than assuming it's fine", async () => {
    const itinerary = itineraryWithStops([
      { name: "A", naptanId: "OPEN_A" },
      { name: "Mystery", naptanId: "NOT_IN_DB" },
    ]);

    const [result] = await annotateBarrierFree([itinerary]);
    expect(result.isBarrierFree).toBe(false);
    expect(result.touchpoints.find((t) => t.name === "Mystery")?.status).toBe("UNKNOWN");
  });

  it("excludes a route with no NaPTAN id at all (can't be looked up)", async () => {
    const itinerary = itineraryWithStops([
      { name: "A", naptanId: "OPEN_A" },
      { name: "No Id Station", naptanId: null },
    ]);

    const [result] = await annotateBarrierFree([itinerary]);
    expect(result.isBarrierFree).toBe(false);
  });
});
