// Server-side only. Never imported from a client-facing island directly —
// only from src/pages/api/flight-search.ts and pages that need it at SSR
// time, so the API key never reaches the browser.

const AVIATIONSTACK_API_KEY = process.env.AVIATIONSTACK_API_KEY;
const BASE_URL = "https://api.aviationstack.com/v1/flights";

// Two separate TTLs, not one shared budget: searchFlights is user-initiated
// (a visitor typing a flight number or airport code) — low volume, kept
// short for freshness. getAirportBoard runs automatically on every cold
// homepage load whether anyone searches or not, so on a capped plan
// (AviationStack's free tier is 100 calls/*month*) a short TTL there burns
// through the entire monthly quota from passive traffic alone, before a
// single visitor touches a search box — which is exactly what happened.
const SEARCH_CACHE_TTL_MS = Number(process.env.AVIATIONSTACK_CACHE_TTL ?? 120) * 1000;
const BOARD_CACHE_TTL_MS = Number(process.env.AVIATIONSTACK_BOARD_CACHE_TTL ?? 21600) * 1000;

export interface FlightSearchParams {
  flightNumber?: string;
  depIata?: string;
  arrIata?: string;
}

export type FlightSearchResult =
  | { status: "ok"; flights: unknown[] }
  | { status: "no-results" }
  | { status: "error"; message: string }
  | { status: "rate-limited" };

export interface AirportBoardEntry {
  flightNumber: string | null;
  airline: string | null;
  otherAirport: string | null;
  otherAirportIata: string | null;
  scheduled: string | null;
  status: string | null;
}

export type AirportBoardResult =
  | { status: "ok"; flights: AirportBoardEntry[] }
  | { status: "no-results" }
  | { status: "error"; message: string }
  | { status: "rate-limited" };

type RawFetchResult =
  | { status: "ok"; data: unknown[] }
  | { status: "no-results" }
  | { status: "error"; message: string }
  | { status: "rate-limited" };

// Shared by searchFlights (one flight, by number or dep+arr pair) and
// getAirportBoard (many flights, by dep_iata or arr_iata alone) — same
// upstream endpoint, same error/rate-limit/empty-result handling either way.
async function fetchFlights(query: URLSearchParams): Promise<RawFetchResult> {
  // Guards the type (narrows AVIATIONSTACK_API_KEY to string below) and the
  // runtime behavior: without this, URLSearchParams silently stringifies a
  // missing key to the literal text "undefined" and still makes the call.
  if (!AVIATIONSTACK_API_KEY) {
    return { status: "error", message: "AviationStack API key is not configured" };
  }

  query.set("access_key", AVIATIONSTACK_API_KEY);

  try {
    const res = await fetch(`${BASE_URL}?${query.toString()}`);

    if (res.status === 429) return { status: "rate-limited" };
    if (!res.ok) return { status: "error", message: `Upstream error ${res.status}` };

    const body = await res.json();
    if (body.error) return { status: "error", message: body.error.message ?? "Unknown upstream error" };
    if (!Array.isArray(body.data) || body.data.length === 0) return { status: "no-results" };

    return { status: "ok", data: body.data };
  } catch {
    return { status: "error", message: "Network error contacting AviationStack" };
  }
}

const searchCache = new Map<string, { expires: number; result: FlightSearchResult }>();

function searchCacheKey(params: FlightSearchParams): string {
  return JSON.stringify([params.flightNumber ?? "", params.depIata ?? "", params.arrIata ?? ""]);
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResult> {
  const key = searchCacheKey(params);
  const now = Date.now();
  const cached = searchCache.get(key);
  if (cached && cached.expires > now) return cached.result;

  const query = new URLSearchParams();
  if (params.flightNumber) query.set("flight_iata", params.flightNumber);
  if (params.depIata) query.set("dep_iata", params.depIata);
  if (params.arrIata) query.set("arr_iata", params.arrIata);

  const raw = await fetchFlights(query);
  const result: FlightSearchResult = raw.status === "ok" ? { status: "ok", flights: raw.data } : raw;

  // Cache successes and empty results; don't cache transient errors/rate-limits.
  if (result.status === "ok" || result.status === "no-results") {
    searchCache.set(key, { expires: now + SEARCH_CACHE_TTL_MS, result });
  }

  return result;
}

interface RawBoardFlight {
  flight?: { iata?: string | null; number?: string | null };
  airline?: { name?: string | null };
  flight_status?: string | null;
  departure?: { airport?: string | null; iata?: string | null; scheduled?: string | null };
  arrival?: { airport?: string | null; iata?: string | null; scheduled?: string | null };
}

function normalizeBoardEntry(raw: unknown, direction: "departure" | "arrival"): AirportBoardEntry {
  const f = raw as RawBoardFlight;
  // "Other" airport is the one that's interesting to show: for a departure
  // board (flights leaving LOS) that's where each flight is arriving; for
  // an arrival board it's where each flight departed from.
  const other = direction === "departure" ? f.arrival : f.departure;

  return {
    flightNumber: f.flight?.iata ?? f.flight?.number ?? null,
    airline: f.airline?.name ?? null,
    otherAirport: other?.airport ?? null,
    otherAirportIata: other?.iata ?? null,
    scheduled: other?.scheduled ?? null,
    status: f.flight_status ?? null,
  };
}

const boardCache = new Map<string, { expires: number; result: AirportBoardResult }>();

/** Live departures-from or arrivals-to `iata`, newest AviationStack data available, capped to a homepage-sized list. */
export async function getAirportBoard(direction: "departure" | "arrival", iata = "LOS"): Promise<AirportBoardResult> {
  const key = `${direction}:${iata}`;
  const now = Date.now();
  const cached = boardCache.get(key);
  if (cached && cached.expires > now) return cached.result;

  // Homepage-sized list — the welcome-section panel is the only remaining
  // consumer (hero's tabs became user-initiated search), so this caps how
  // long that table gets, not a rate-limit workaround.
  const query = new URLSearchParams({ limit: "6" });
  query.set(direction === "departure" ? "dep_iata" : "arr_iata", iata);

  const raw = await fetchFlights(query);
  const result: AirportBoardResult =
    raw.status === "ok" ? { status: "ok", flights: raw.data.map((f) => normalizeBoardEntry(f, direction)) } : raw;

  if (result.status === "ok" || result.status === "no-results") {
    boardCache.set(key, { expires: now + BOARD_CACHE_TTL_MS, result });
  }

  return result;
}

const scheduledTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

/** Renders an AviationStack scheduled timestamp in LOS local time, or an em dash if missing/invalid. */
export function formatScheduledTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : scheduledTimeFormatter.format(date);
}
