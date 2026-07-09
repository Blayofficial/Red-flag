export type TransportMode =
  | "tube"
  | "overground"
  | "dlr"
  | "elizabeth-line"
  | "national-rail"
  | "tram";

export type BarrierStatus = "OPEN_ACCESS" | "GATED" | "MIXED" | "UNKNOWN";

export interface Station {
  id: string;
  name: string;
  naptanId: string | null;
  latitude: number;
  longitude: number;
  operator: string | null;
  transportMode: TransportMode;
  lines: string[];
}

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

export interface StationWithBarrierInfo extends Station {
  barrier: BarrierInfo | null;
}
