# BarrierFree

A London transport journey planner that only recommends journeys where the
passenger never has to pass through a ticket barrier — start to finish,
including every interchange.

## Why this exists

Most journey planners optimise for time. BarrierFree optimises for
friction-free travel: every station a route touches (origin, interchanges,
destination) has to be confirmed `OPEN_ACCESS` or the route doesn't get
shown, when Barrier-Free Mode is on.

## Project structure

```
apps/
  mobile/                 Expo (React Native) app — iOS, Android, and web from one codebase
    src/api/               typed fetch client for the backend
    src/screens/           Home, Results, Station Details
    src/components/        StationAutocomplete, BarrierBadge
services/
  api/                     Node.js/Express backend
    src/domain/             shared types
    src/stations/           station search/details
    src/barriers/           barrier lookups + manual-review queue
    src/routing/            TfL Journey Planner client + barrier-free filter
    src/ingestion/           data pipeline (see below)
    migrations/              SQL schema migrations (node-pg-migrate)
    test/                    unit + integration tests (vitest)
infra/
  docker-compose.yml         Postgres for local dev
```

## Architecture, in short

- **We don't build our own transit router.** TfL's Journey Planner API
  already solves multi-modal routing accurately; `services/api/src/routing`
  calls it for real candidate itineraries and layers the barrier-free
  filter on top. That filter is the actual product.
- **A route counts as barrier-free only if every touchpoint is confirmed
  `OPEN_ACCESS`.** `GATED`, `MIXED`, *and* `UNKNOWN` are all excluded by
  default — confirming a route through a station we're not sure about would
  be exactly the kind of false assumption this project is meant to avoid.
- **Barrier status is modelled per-station, not per-line.** A few stations
  (Waterloo is the clearest example — only its Waterloo & City line
  platforms are ungated) genuinely need line/zone-level granularity to be
  fully correct. This MVP doesn't model that; those stations are marked
  `MIXED` with notes and excluded from Barrier-Free Mode by default.

## Getting started

**Database** (either works):
```bash
# Option A: Docker
cd infra && docker compose up -d

# Option B: a local Postgres install
createuser barrierfree --superuser --pwprompt   # password: barrierfree
createdb barrierfree --owner barrierfree
```

**Backend:**
```bash
cd services/api
cp .env.example .env
npm install
npm run migrate
npm run seed        # loads the curated pilot dataset — see "Data" below
npm run dev          # http://localhost:4000
```

**Mobile/web app:**
```bash
cd apps/mobile
npm install
npm run web          # or: npm run ios / npm run android
```

## Data: what's real, what's seeded, what's still to do

**The pilot dataset the app ships with (`npm run seed`) is real, cited
data for ~33 stations** — not fabricated. It includes:
- Every station named in a genuine TfL Freedom of Information response
  listing London Underground/Overground stations without full gatelines
- A handful verified directly against train operating companies' own
  station pages (Chiswick, Wandsworth Common, Wandsworth Road, Clapham
  High Street, Wandsworth Town)
- Waterloo, modelled as `MIXED` with the specific nuance (Waterloo & City
  line platforms only) cited
- A batch of well-known major interchanges marked `GATED` (common
  knowledge, not individually FOI-verified — flagged as such)
- A few genuinely uncertain stations (Euston Square, Stratford, Clapham
  Junction) left `UNKNOWN` and flagged for manual review, rather than
  guessed

**This is a pilot, not full London coverage.** Scaling to all ~470
London rail/Underground stations needs the real ingestion pipeline
(`services/api/src/ingestion/tflStopPoints.ts`) run somewhere with normal
internet access — this project was built in a sandboxed environment whose
network policy blocks outbound requests to `api.tfl.gov.uk`,
`naptan.api.dft.gov.uk`, and even `en.wikipedia.org` entirely (confirmed,
not assumed — every fetch attempt returned a 403 at the proxy level). The
ingestion script itself is real, type-checked code; it's simply never been
run against a live response. Treat it as "ready to run," not "already
verified," and smoke-test it before trusting its output at scale.

Also worth knowing: `services/api/src/routing/tflClient.ts`'s
understanding of TfL's Journey Planner response shape is based on TfL's
documented API, not a live call (same network restriction). Verify the
field names against a real response before relying on it in production.

## Testing

```bash
cd services/api
npm test              # unit tests (pure logic) + integration tests (real DB)
```

The integration tests need `DATABASE_URL` set and the seed data loaded;
they skip themselves automatically if `DATABASE_URL` isn't set.

## API

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness + DB connectivity check |
| `GET /stations/search?q=` | Station search/autocomplete, with barrier info |
| `GET /stations/:id` | Full station detail |
| `GET /barriers/review-queue` | Stations flagged `needs_manual_review` |
| `GET /journeys?from=&to=&barrierFree=` | TfL itineraries, barrier-filtered |
