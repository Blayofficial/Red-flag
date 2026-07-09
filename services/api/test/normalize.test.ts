import { describe, expect, it } from "vitest";
import { normalizeJourneys, touchpointsOf } from "../src/routing/normalize.js";
import type { TflJourneyResult } from "../src/routing/tflClient.js";

const sampleRaw: TflJourneyResult = {
  journeys: [
    {
      duration: 32,
      legs: [
        {
          duration: 10,
          mode: { id: "overground", name: "London Overground" },
          departurePoint: { commonName: "Wandsworth Common", naptanId: "9400ZZLUWSC" },
          arrivalPoint: { commonName: "Clapham Junction", naptanId: "9400ZZLUCPJ" },
        },
        {
          duration: 22,
          mode: { id: "overground", name: "London Overground" },
          departurePoint: { commonName: "Clapham Junction", naptanId: "9400ZZLUCPJ" },
          arrivalPoint: { commonName: "Chiswick", naptanId: "9400ZZLUCHW" },
        },
      ],
    },
  ],
};

describe("normalizeJourneys", () => {
  it("maps duration and change count", () => {
    const [itinerary] = normalizeJourneys(sampleRaw);
    expect(itinerary.durationMinutes).toBe(32);
    expect(itinerary.changes).toBe(1);
    expect(itinerary.legs).toHaveLength(2);
  });

  it("a single-leg journey has zero changes", () => {
    const singleLeg: TflJourneyResult = {
      journeys: [{ ...sampleRaw.journeys[0], legs: [sampleRaw.journeys[0].legs[0]] }],
    };
    const [itinerary] = normalizeJourneys(singleLeg);
    expect(itinerary.changes).toBe(0);
  });
});

describe("touchpointsOf", () => {
  it("includes the origin, every interchange, and the destination exactly once each", () => {
    const [itinerary] = normalizeJourneys(sampleRaw);
    const points = touchpointsOf(itinerary);
    expect(points.map((p) => p.name)).toEqual(["Wandsworth Common", "Clapham Junction", "Chiswick"]);
  });
});
