// Mirrors services/api/src/domain/types.ts — kept in sync by hand for now.

export type BarrierStatus = "OPEN_ACCESS" | "GATED" | "MIXED" | "UNKNOWN";

export interface BarrierSource {
  type: "foi" | "osm" | "official_docs" | "general_knowledge" | "manual";
  ref: string;
  note?: string;
}

export interface BarrierInfo {
  stationId: string;
  status: BarrierStatus;
  confidenceScore: number;
  sources: BarrierSource[];
  notes: string | null;
  needsManualReview: boolean;
  lastVerifiedDate: string | null;
}

export interface Station {
  id: string;
  name: string;
  naptanId: string | null;
  latitude: number;
  longitude: number;
  operator: string | null;
  transportMode: string;
  lines: string[];
  barrier: BarrierInfo | null;
}

export interface RouteStation {
  stationId: string | null;
  name: string;
  status: BarrierStatus;
  confirmed: boolean;
}

export interface RouteLeg {
  mode: string;
  from: string;
  to: string;
  durationMinutes: number;
}

export interface JourneyRoute {
  durationMinutes: number;
  changes: number;
  isBarrierFree: boolean;
  stations: RouteStation[];
  legs: RouteLeg[];
}
