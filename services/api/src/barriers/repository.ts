import { pool } from "../db/pool.js";
import type { BarrierSource, BarrierStatus } from "../domain/types.js";

interface BarrierByNaptanRow {
  naptan_id: string;
  station_id: string;
  status: BarrierStatus;
  confidence_score: string;
}

/** Barrier status keyed by NaPTAN id, for annotating TfL journey results (which identify stops by NaPTAN id). */
export async function getBarrierStatusByNaptanIds(
  naptanIds: string[],
): Promise<Map<string, { stationId: string; status: BarrierStatus; confidenceScore: number }>> {
  if (naptanIds.length === 0) return new Map();

  const { rows } = await pool.query<BarrierByNaptanRow>(
    `SELECT s.naptan_id, s.id AS station_id, b.status, b.confidence_score
     FROM stations s
     JOIN barrier_info b ON b.station_id = s.id
     WHERE s.naptan_id = ANY($1::text[])`,
    [naptanIds],
  );

  return new Map(
    rows.map((row) => [
      row.naptan_id,
      { stationId: row.station_id, status: row.status, confidenceScore: Number(row.confidence_score) },
    ]),
  );
}

interface ReviewRow {
  station_id: string;
  station_name: string;
  status: BarrierStatus;
  confidence_score: string;
  sources: BarrierSource[];
  notes: string | null;
}

/** Stations flagged for manual review — the human-in-the-loop step the spec requires for anything uncertain. */
export async function listStationsNeedingReview() {
  const { rows } = await pool.query<ReviewRow>(
    `SELECT b.station_id, s.name AS station_name, b.status, b.confidence_score, b.sources, b.notes
     FROM barrier_info b
     JOIN stations s ON s.id = b.station_id
     WHERE b.needs_manual_review = true
     ORDER BY b.confidence_score ASC, s.name ASC`,
  );

  return rows.map((row) => ({
    stationId: row.station_id,
    stationName: row.station_name,
    status: row.status,
    confidenceScore: Number(row.confidence_score),
    sources: row.sources,
    notes: row.notes,
  }));
}
