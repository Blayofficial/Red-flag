import { pool } from "../db/pool.js";
import type { BarrierSource, BarrierStatus, StationWithBarrierInfo } from "../domain/types.js";

interface StationRow {
  id: string;
  name: string;
  naptan_id: string | null;
  latitude: number;
  longitude: number;
  operator: string | null;
  transport_mode: StationWithBarrierInfo["transportMode"];
  lines: string[] | null;
  barrier_status: BarrierStatus | null;
  confidence_score: string | null;
  sources: BarrierSource[] | null;
  notes: string | null;
  needs_manual_review: boolean | null;
  last_verified_date: string | null;
}

const SELECT_STATION_WITH_BARRIER = `
  SELECT
    s.id, s.name, s.naptan_id, s.latitude, s.longitude, s.operator, s.transport_mode,
    coalesce(array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL), '{}') AS lines,
    b.status AS barrier_status,
    b.confidence_score,
    b.sources,
    b.notes,
    b.needs_manual_review,
    b.last_verified_date
  FROM stations s
  LEFT JOIN station_lines sl ON sl.station_id = s.id
  LEFT JOIN lines l ON l.id = sl.line_id
  LEFT JOIN barrier_info b ON b.station_id = s.id
`;

function toStation(row: StationRow): StationWithBarrierInfo {
  return {
    id: row.id,
    name: row.name,
    naptanId: row.naptan_id,
    latitude: row.latitude,
    longitude: row.longitude,
    operator: row.operator,
    transportMode: row.transport_mode,
    lines: row.lines ?? [],
    barrier: row.barrier_status
      ? {
          stationId: row.id,
          status: row.barrier_status,
          confidenceScore: row.confidence_score ? Number(row.confidence_score) : 0,
          sources: row.sources ?? [],
          notes: row.notes,
          needsManualReview: row.needs_manual_review ?? true,
          lastVerifiedDate: row.last_verified_date,
        }
      : null,
  };
}

export async function searchStations(query: string, limit = 10): Promise<StationWithBarrierInfo[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const { rows } = await pool.query<StationRow>(
    `${SELECT_STATION_WITH_BARRIER}
     WHERE s.normalized_name LIKE $1
     GROUP BY s.id, b.status, b.confidence_score, b.sources, b.notes, b.needs_manual_review, b.last_verified_date
     ORDER BY s.name ASC
     LIMIT $2`,
    [`%${normalized}%`, limit],
  );

  return rows.map(toStation);
}

export async function getStationById(id: string): Promise<StationWithBarrierInfo | null> {
  const { rows } = await pool.query<StationRow>(
    `${SELECT_STATION_WITH_BARRIER}
     WHERE s.id = $1
     GROUP BY s.id, b.status, b.confidence_score, b.sources, b.notes, b.needs_manual_review, b.last_verified_date`,
    [id],
  );

  return rows[0] ? toStation(rows[0]) : null;
}

/** Nearest stations to a coordinate, for turning free-text locations into a station to route from/to. */
export async function findNearestStations(
  latitude: number,
  longitude: number,
  limit = 5,
): Promise<StationWithBarrierInfo[]> {
  const { rows } = await pool.query<StationRow>(
    `${SELECT_STATION_WITH_BARRIER}
     GROUP BY s.id, b.status, b.confidence_score, b.sources, b.notes, b.needs_manual_review, b.last_verified_date
     ORDER BY earth_distance(ll_to_earth(s.latitude, s.longitude), ll_to_earth($1, $2)) ASC
     LIMIT $3`,
    [latitude, longitude, limit],
  );

  return rows.map(toStation);
}
