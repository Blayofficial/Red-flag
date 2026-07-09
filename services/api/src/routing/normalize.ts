import type { TflJourneyResult } from "./tflClient.js";

export interface ItineraryLeg {
  mode: string;
  fromStationName: string;
  fromNaptanId: string | null;
  toStationName: string;
  toNaptanId: string | null;
  durationMinutes: number;
}

export interface Itinerary {
  durationMinutes: number;
  changes: number;
  legs: ItineraryLeg[];
}

export function normalizeJourneys(raw: TflJourneyResult): Itinerary[] {
  return raw.journeys.map((journey) => ({
    durationMinutes: journey.duration,
    changes: Math.max(journey.legs.length - 1, 0),
    legs: journey.legs.map((leg) => ({
      mode: leg.mode.id,
      fromStationName: leg.departurePoint.commonName,
      fromNaptanId: leg.departurePoint.naptanId ?? null,
      toStationName: leg.arrivalPoint.commonName,
      toNaptanId: leg.arrivalPoint.naptanId ?? null,
      durationMinutes: leg.duration,
    })),
  }));
}

/** Every station the passenger physically touches: origin, every interchange, and the destination. */
export function touchpointsOf(itinerary: Itinerary): Array<{ name: string; naptanId: string | null }> {
  const points: Array<{ name: string; naptanId: string | null }> = [];

  itinerary.legs.forEach((leg, index) => {
    if (index === 0) {
      points.push({ name: leg.fromStationName, naptanId: leg.fromNaptanId });
    }
    points.push({ name: leg.toStationName, naptanId: leg.toNaptanId });
  });

  return points;
}
