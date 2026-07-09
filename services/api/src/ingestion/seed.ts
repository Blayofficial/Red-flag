/**
 * Seeds a curated pilot batch of real London stations with genuinely
 * sourced barrier data — NOT a substitute for running the full TfL/NaPTAN
 * ingestion (tflStopPoints.ts), which needs live network access this
 * sandbox doesn't have. This is what makes the app testable end-to-end
 * right now.
 *
 * Every OPEN_ACCESS / GATED / MIXED entry below is backed by a real,
 * cited source found via web research (mostly a TfL Freedom of
 * Information response and train operating companies' own station pages)
 * — never a guess. Coordinates are approximate (good enough for
 * map/search UI); the real ingestion pipeline will replace them with
 * authoritative NaPTAN coordinates. Anything not confidently verified is
 * UNKNOWN and flagged for manual review, per the spec.
 */
import { pool } from "../db/pool.js";
import type { BarrierSource, BarrierStatus, TransportMode } from "../domain/types.js";
import { NETWORK_STATIONS } from "./networkStations.js";

interface SeedStation {
  name: string;
  latitude: number;
  longitude: number;
  operator: string;
  mode: TransportMode;
  lines: string[];
  barrier: {
    status: BarrierStatus;
    confidence: number;
    sources: BarrierSource[];
    notes?: string;
    needsReview?: boolean;
  };
}

const FOI_SOURCE: BarrierSource = {
  type: "foi",
  ref: "https://www.whatdotheyknow.com/request/request_for_some_information_reg_2",
  note: "TfL FOI response naming LU/Overground stations without full gatelines",
};

const STATIONS: SeedStation[] = [
  // --- FOI-confirmed open access (London Underground / Overground) ---
  { name: "Chalfont & Latimer", latitude: 51.6683, longitude: -0.5606, operator: "London Underground", mode: "tube", lines: ["Metropolitan"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "Chorleywood", latitude: 51.6535, longitude: -0.5195, operator: "London Underground", mode: "tube", lines: ["Metropolitan"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "Finchley Central", latitude: 51.6014, longitude: -0.1928, operator: "London Underground", mode: "tube", lines: ["Northern"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "Mill Hill East", latitude: 51.6084, longitude: -0.2405, operator: "London Underground", mode: "tube", lines: ["Northern"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "Pinner", latitude: 51.593, longitude: -0.3805, operator: "London Underground", mode: "tube", lines: ["Metropolitan"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "Roding Valley", latitude: 51.6083, longitude: 0.0447, operator: "London Underground", mode: "tube", lines: ["Central"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "South Kenton", latitude: 51.5729, longitude: -0.3159, operator: "London Underground", mode: "tube", lines: ["Bakerloo"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "West Harrow", latitude: 51.5799, longitude: -0.3542, operator: "London Underground", mode: "tube", lines: ["Metropolitan"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },
  { name: "Woodside Park", latitude: 51.6152, longitude: -0.1789, operator: "London Underground", mode: "tube", lines: ["Northern"], barrier: { status: "OPEN_ACCESS", confidence: 0.85, sources: [FOI_SOURCE] } },

  // --- Verified via train operating companies' own station pages ---
  { name: "Chiswick", latitude: 51.4877, longitude: -0.2675, operator: "South Western Railway", mode: "national-rail", lines: ["South Western Railway"], barrier: { status: "OPEN_ACCESS", confidence: 0.9, sources: [{ type: "official_docs", ref: "https://www.southwesternrailway.com/travelling-with-us/at-the-station/chiswick", note: "SWR station page: no ticket gates" }] } },
  { name: "Wandsworth Common", latitude: 51.4506, longitude: -0.1656, operator: "South Western Railway", mode: "national-rail", lines: ["South Western Railway"], barrier: { status: "OPEN_ACCESS", confidence: 0.9, sources: [{ type: "official_docs", ref: "https://www.southwesternrailway.com/travelling-with-us/at-the-station/wandsworth-common", note: "SWR station page: no ticket gates" }] } },
  { name: "Wandsworth Road", latitude: 51.4713, longitude: -0.1428, operator: "South Western Railway", mode: "national-rail", lines: ["South Western Railway"], barrier: { status: "OPEN_ACCESS", confidence: 0.9, sources: [{ type: "official_docs", ref: "https://www.southwesternrailway.com/travelling-with-us/at-the-station/wandsworth-road", note: "SWR station page: no ticket gates" }] } },
  { name: "Clapham High Street", latitude: 51.4649, longitude: -0.1306, operator: "London Overground", mode: "overground", lines: ["Windrush"], barrier: { status: "OPEN_ACCESS", confidence: 0.9, sources: [{ type: "official_docs", ref: "https://www.southwesternrailway.com/travelling-with-us/at-the-station/clapham-high-street", note: "Station page: no ticket gates" }] } },
  { name: "Wandsworth Town", latitude: 51.4573, longitude: -0.1923, operator: "South Western Railway", mode: "national-rail", lines: ["South Western Railway"], barrier: { status: "GATED", confidence: 0.85, sources: [{ type: "official_docs", ref: "https://www.southwesternrailway.com/travelling-with-us/at-the-station/wandsworth-town", note: "Station page confirms ticket gates" }] } },

  // --- MIXED: needs line/zone-level nuance this MVP doesn't model ---
  { name: "Waterloo", latitude: 51.5033, longitude: -0.1145, operator: "London Underground / Network Rail", mode: "tube", lines: ["Waterloo & City", "Bakerloo", "Northern", "Jubilee"], barrier: { status: "MIXED", confidence: 0.7, sources: [{ type: "official_docs", ref: "https://www.accessable.co.uk/london-waterloo/access-guides/london-waterloo-station", note: "Waterloo & City line platforms (25/26) have no gates; rest of the station does" }], notes: "Only barrier-free via the Waterloo & City line platforms — everything else at this station is gated. Excluded from Barrier-Free Mode by default until line-level modelling exists.", needsReview: true } },
  { name: "Finsbury Park", latitude: 51.5642, longitude: -0.1064, operator: "London Underground / Network Rail", mode: "tube", lines: ["Victoria", "Piccadilly"], barrier: { status: "MIXED", confidence: 0.55, sources: [FOI_SOURCE], notes: "Large multi-operator interchange; FOI response is dated and this station has had gateline work since. Needs fresh verification.", needsReview: true } },

  // --- UNKNOWN: genuinely uncertain, explicitly not guessed ---
  { name: "Euston Square", latitude: 51.5258, longitude: -0.1359, operator: "London Underground", mode: "tube", lines: ["Metropolitan", "Circle", "Hammersmith & City"], barrier: { status: "UNKNOWN", confidence: 0.4, sources: [FOI_SOURCE], notes: "FOI response listed this as open access, but other reporting indicates the gateline/lift layout was modified since. Conflicting signals — needs direct verification, not an assumption either way.", needsReview: true } },
  { name: "Stratford", latitude: 51.5416, longitude: -0.0042, operator: "London Underground / Network Rail / DLR", mode: "tube", lines: ["Central", "Jubilee", "DLR", "Elizabeth line"], barrier: { status: "UNKNOWN", confidence: 0.3, sources: [], notes: "Very large multi-operator interchange (LU, DLR, Elizabeth line, National Rail). Barrier layout likely differs by zone within the station; not safely reducible to one status without dedicated research.", needsReview: true } },
  { name: "Clapham Junction", latitude: 51.4642, longitude: -0.1705, operator: "Network Rail", mode: "national-rail", lines: ["South Western Railway", "Southern", "London Overground"], barrier: { status: "UNKNOWN", confidence: 0.3, sources: [], notes: "One of the busiest interchanges in Europe with multiple operators; gating policy not confidently established from available sources.", needsReview: true } },

  // --- GATED: well-documented major interchanges (general knowledge, not individually FOI-cited) ---
  ...(
    [
      ["King's Cross St Pancras", 51.5308, -0.1238, ["Northern", "Victoria", "Piccadilly", "Circle", "Hammersmith & City", "Metropolitan"]],
      ["Oxford Circus", 51.5152, -0.1418, ["Central", "Victoria", "Bakerloo"]],
      ["Victoria", 51.4965, -0.1447, ["Victoria", "Circle", "District"]],
      ["Liverpool Street", 51.5178, -0.0823, ["Central", "Circle", "Hammersmith & City", "Metropolitan", "Elizabeth line"]],
      ["Bank", 51.5133, -0.0886, ["Central", "Northern", "Waterloo & City", "DLR"]],
      ["Bond Street", 51.5142, -0.1494, ["Central", "Jubilee", "Elizabeth line"]],
      ["Green Park", 51.5067, -0.1428, ["Victoria", "Piccadilly", "Jubilee"]],
      ["Leicester Square", 51.5113, -0.1281, ["Northern", "Piccadilly"]],
      ["Piccadilly Circus", 51.51, -0.1344, ["Bakerloo", "Piccadilly"]],
      ["Baker Street", 51.5226, -0.1571, ["Metropolitan", "Circle", "Bakerloo", "Jubilee", "Hammersmith & City"]],
      ["Paddington", 51.5154, -0.1755, ["Circle", "District", "Bakerloo", "Hammersmith & City", "Elizabeth line"]],
      ["Euston", 51.5282, -0.1337, ["Northern", "Victoria"]],
      ["Canary Wharf", 51.5051, -0.0209, ["Jubilee", "DLR", "Elizabeth line"]],
      ["Vauxhall", 51.4861, -0.1235, ["Victoria"]],
    ] as const
  ).map(([name, latitude, longitude, lines]) => ({
    name,
    latitude,
    longitude,
    operator: "London Underground",
    mode: "tube" as TransportMode,
    lines: [...lines],
    barrier: {
      status: "GATED" as BarrierStatus,
      confidence: 0.75,
      sources: [
        {
          type: "general_knowledge" as const,
          ref: "n/a",
          note: "Well-documented major Zone 1 interchange with a staffed gateline; not individually FOI-verified for this pilot batch",
        },
      ],
      needsReview: false,
    },
  })),
];

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function upsertStation(station: SeedStation): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO stations (name, normalized_name, latitude, longitude, operator, transport_mode)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [station.name, normalizeName(station.name), station.latitude, station.longitude, station.operator, station.mode],
  );
  return rows[0].id;
}

async function upsertLine(name: string, mode: TransportMode): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO lines (name, mode) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET mode = EXCLUDED.mode
     RETURNING id`,
    [name, mode],
  );
  return rows[0].id;
}

async function insertStationWithBarrier(
  station: Pick<SeedStation, "name" | "latitude" | "longitude" | "operator" | "mode" | "lines">,
  barrier: SeedStation["barrier"],
): Promise<void> {
  const stationId = await upsertStation(station as SeedStation);

  for (const lineName of station.lines) {
    const lineId = await upsertLine(lineName, station.mode);
    await pool.query(
      `INSERT INTO station_lines (station_id, line_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [stationId, lineId],
    );
  }

  await pool.query(
    `INSERT INTO barrier_info (station_id, status, confidence_score, sources, notes, needs_manual_review, last_verified_date)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)`,
    [
      stationId,
      barrier.status,
      barrier.confidence,
      JSON.stringify(barrier.sources),
      barrier.notes ?? null,
      barrier.needsReview ?? false,
    ],
  );
}

async function seed(): Promise<void> {
  await pool.query("TRUNCATE stations, lines, station_lines, barrier_info CASCADE");

  for (const station of STATIONS) {
    await insertStationWithBarrier(station, station.barrier);
  }

  // Full-network coverage (Underground/Overground/DLR/Elizabeth line) —
  // real station names/lines, but UNKNOWN barrier status by default. Skips
  // anything already covered by the researched pilot batch above, matched
  // by (mode, normalized name) — matching by name alone would wrongly drop
  // e.g. Stratford's Overground/DLR/Elizabeth line rows just because the
  // pilot batch already has a *tube*-mode Stratford entry; same name,
  // different physical platforms/mode, still needs its own row.
  const pilotKeys = new Set(STATIONS.map((s) => `${s.mode}:${normalizeName(s.name)}`));
  const networkOnly = NETWORK_STATIONS.filter((s) => !pilotKeys.has(`${s.mode}:${normalizeName(s.name)}`));

  const operatorByMode: Record<TransportMode, string> = {
    tube: "London Underground",
    overground: "London Overground",
    dlr: "DLR",
    "elizabeth-line": "Elizabeth line",
    "national-rail": "National Rail",
    tram: "London Trams",
  };

  for (const station of networkOnly) {
    await insertStationWithBarrier(
      { ...station, operator: operatorByMode[station.mode] },
      {
        status: "UNKNOWN",
        confidence: 0.2,
        sources: [],
        notes: "Not yet researched — part of the bulk network-coverage import, not the verified pilot batch.",
        needsReview: true,
      },
    );
  }

  console.log(`Seeded ${STATIONS.length} researched + ${networkOnly.length} network-coverage stations.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => pool.end())
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exitCode = 1;
    });
}
