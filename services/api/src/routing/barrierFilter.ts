import type { BarrierStatus } from "../domain/types.js";
import { getBarrierStatusByNaptanIds } from "../barriers/repository.js";
import { touchpointsOf, type Itinerary } from "./normalize.js";

export interface TouchpointCheck {
  name: string;
  naptanId: string | null;
  stationId: string | null; // null if this stop couldn't be matched to a station in our database
  status: BarrierStatus;
  confirmed: boolean; // true only for OPEN_ACCESS
}

export interface BarrierFreeResult {
  itinerary: Itinerary;
  isBarrierFree: boolean;
  touchpoints: TouchpointCheck[];
}

/**
 * A route only counts as barrier-free if every touchpoint — origin, every
 * interchange, destination — is confirmed OPEN_ACCESS. GATED is an obvious
 * exclusion; MIXED and UNKNOWN are *also* excluded by default, even though
 * the spec only explicitly calls out GATED. Confirming "barrier-free" for a
 * station we're not actually sure about would be exactly the kind of false
 * assumption the spec says not to make. MIXED stations (like Waterloo,
 * where only the Waterloo & City line platforms are ungated) need
 * line-level data this MVP doesn't model yet — see README.
 */
export async function annotateBarrierFree(itineraries: Itinerary[]): Promise<BarrierFreeResult[]> {
  const allTouchpoints = itineraries.flatMap(touchpointsOf);
  const naptanIds = [...new Set(allTouchpoints.map((p) => p.naptanId).filter((id): id is string => id !== null))];
  const barrierByNaptan = await getBarrierStatusByNaptanIds(naptanIds);

  return itineraries.map((itinerary) => {
    const touchpoints: TouchpointCheck[] = touchpointsOf(itinerary).map((point) => {
      const barrier = point.naptanId ? barrierByNaptan.get(point.naptanId) : undefined;
      const status: BarrierStatus = barrier?.status ?? "UNKNOWN";
      return {
        name: point.name,
        naptanId: point.naptanId,
        stationId: barrier?.stationId ?? null,
        status,
        confirmed: status === "OPEN_ACCESS",
      };
    });

    return {
      itinerary,
      isBarrierFree: touchpoints.every((point) => point.confirmed),
      touchpoints,
    };
  });
}
