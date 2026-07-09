import { API_BASE_URL } from "./config";
import type { JourneyRoute, Station } from "./types";

export class ApiError extends Error {}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new ApiError("Couldn't reach the BarrierFree server. Check it's running and reachable.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function searchStations(query: string): Promise<{ stations: Station[] }> {
  return request(`/stations/search?q=${encodeURIComponent(query)}`);
}

export function getStation(id: string): Promise<{ station: Station }> {
  return request(`/stations/${id}`);
}

export function getJourneys(
  fromStationId: string,
  toStationId: string,
  barrierFreeMode: boolean,
): Promise<{ routes: JourneyRoute[]; barrierFreeModeEnabled: boolean }> {
  return request(
    `/journeys?from=${encodeURIComponent(fromStationId)}&to=${encodeURIComponent(toStationId)}&barrierFree=${barrierFreeMode}`,
  );
}
