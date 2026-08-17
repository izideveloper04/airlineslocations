import type { APIRoute } from "astro";
import { searchFlights } from "../../lib/aviationstack";

// Opts out of static prerendering — this is the only route that needs a
// live server, so it's the only part of the site that costs compute per
// request. Everything else ships as static files.
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const flightNumber = url.searchParams.get("flightNumber") ?? undefined;
  const depIata = url.searchParams.get("depIata") ?? undefined;
  const arrIata = url.searchParams.get("arrIata") ?? undefined;

  if (!flightNumber && !(depIata && arrIata)) {
    return new Response(
      JSON.stringify({ status: "error", message: "Provide a flightNumber or depIata+arrIata" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const result = await searchFlights({ flightNumber, depIata, arrIata });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
