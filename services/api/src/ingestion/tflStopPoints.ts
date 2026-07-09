/**
 * Pulls live station + line data from TfL's Open Data StopPoint API and
 * upserts it into `stations` / `lines` / `station_lines`.
 *
 * NOT executed from the sandbox this project was built in — that
 * environment's network policy blocks outbound requests to api.tfl.gov.uk
 * entirely (see README "Known limitations"). This script is real,
 * TypeScript-checked code, but it has not been run against a live
 * response. Run it yourself once you're somewhere with normal internet
 * access:
 *
 *   npm run ingest:tfl --workspace=services/api
 *
 * A free app key (https://api-portal.tfl.gov.uk) raises the rate limit;
 * it works without one at low volume.
 */
import { pool } from "../db/pool.js";

const TFL_BASE_URL = "https://api.tfl.gov.uk";

// TfL's own mode identifiers. Deliberately excludes "bus" — a bus stop has
// no gateline concept, so it's out of scope for a barrier-free journey
// planner entirely.
const MODES = ["tube", "overground", "dlr", "elizabeth-line", "national-rail", "tram"] as const;
type Mode = (typeof MODES)[number];

interface TflStopPoint {
  id: string; // NaPTAN/ATCO code
  commonName: string;
  lat: number;
  lon: number;
  modes: string[];
  lines?: Array<{ id: string; name: string }>;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+underground station$/, "")
    .replace(/\s+station$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function fetchStopPoints(mode: Mode, appKey?: string): Promise<TflStopPoint[]> {
  const url = new URL(`${TFL_BASE_URL}/StopPoint/Mode/${mode}`);
  if (appKey) url.searchParams.set("app_key", appKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TfL StopPoint request failed for mode=${mode}: ${response.status}`);
  }

  const body = (await response.json()) as { stopPoints: TflStopPoint[] };
  return body.stopPoints;
}

async function upsertStation(stopPoint: TflStopPoint, mode: Mode): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO stations (name, normalized_name, naptan_id, latitude, longitude, transport_mode)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (naptan_id) DO UPDATE SET
       name = EXCLUDED.name,
       normalized_name = EXCLUDED.normalized_name,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       updated_at = now()
     RETURNING id`,
    [stopPoint.commonName, normalizeName(stopPoint.commonName), stopPoint.id, stopPoint.lat, stopPoint.lon, mode],
  );
  return rows[0].id;
}

async function upsertLine(name: string, mode: Mode): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO lines (name, mode) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET mode = EXCLUDED.mode
     RETURNING id`,
    [name, mode],
  );
  return rows[0].id;
}

async function linkStationToLine(stationId: string, lineId: string): Promise<void> {
  await pool.query(
    `INSERT INTO station_lines (station_id, line_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [stationId, lineId],
  );
}

export async function ingestTflStopPoints(appKey?: string): Promise<{ stations: number }> {
  let stationCount = 0;

  for (const mode of MODES) {
    const stopPoints = await fetchStopPoints(mode, appKey);

    for (const stopPoint of stopPoints) {
      const stationId = await upsertStation(stopPoint, mode);
      stationCount += 1;

      for (const line of stopPoint.lines ?? []) {
        const lineId = await upsertLine(line.name, mode);
        await linkStationToLine(stationId, lineId);
      }
    }
  }

  return { stations: stationCount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestTflStopPoints(process.env.TFL_APP_KEY)
    .then((result) => {
      console.log(`Ingested ${result.stations} stations from TfL StopPoint API.`);
      return pool.end();
    })
    .catch((err) => {
      console.error("TfL ingestion failed:", err);
      process.exitCode = 1;
    });
}
