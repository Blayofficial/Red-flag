const TFL_BASE_URL = "https://api.tfl.gov.uk";

/**
 * Raw shape of TfL's Journey Planner response, as documented by TfL's Open
 * Data API. NOT verified against a live call from this environment — this
 * sandbox's network policy blocks outbound requests to api.tfl.gov.uk (see
 * README "Known limitations"). Treat field names here as "best available
 * knowledge, needs a live smoke test" rather than confirmed.
 */
export interface TflJourneyResult {
  journeys: Array<{
    duration: number; // minutes
    legs: Array<{
      duration: number; // minutes
      mode: { id: string; name: string };
      departurePoint: { commonName: string; naptanId?: string };
      arrivalPoint: { commonName: string; naptanId?: string };
    }>;
  }>;
}

export interface TflClientOptions {
  appKey?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Calls TfL's Journey Planner for real candidate itineraries between two
 * stops. We deliberately don't build our own multi-modal routing graph —
 * TfL already solves that problem accurately; this app's job is to filter
 * and annotate their results for barrier-free status.
 */
export async function fetchJourneys(
  fromNaptanId: string,
  toNaptanId: string,
  options: TflClientOptions = {},
): Promise<TflJourneyResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = new URL(`${TFL_BASE_URL}/Journey/JourneyResults/${fromNaptanId}/to/${toNaptanId}`);
  if (options.appKey) {
    url.searchParams.set("app_key", options.appKey);
  }

  const response = await fetchImpl(url.toString());
  if (!response.ok) {
    throw new Error(`TfL Journey Planner request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as TflJourneyResult;
}
