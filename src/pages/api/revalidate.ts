import type { APIRoute } from "astro";
import { timingSafeEqual } from "node:crypto";
import { purgeCache } from "../../lib/wp";

// Opts out of prerendering — this has to run on the live Node process so it
// can mutate the in-memory caches in src/lib/wp.ts (see purgeCache()).
export const prerender = false;

// process.env (not import.meta.env) so the secret can be set/rotated from
// the Hostinger Node.js App panel without a rebuild — same pattern as
// WP_API_URL in src/lib/wp.ts.
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

// Constant-time comparison — a plain `!==` leaks how many leading characters
// matched via response timing, letting an attacker guess the secret one
// character at a time. timingSafeEqual requires equal-length buffers, so a
// length mismatch (the common case) is checked separately and short-circuits
// safely rather than throwing.
function secretsMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  return providedBuf.length === expectedBuf.length && timingSafeEqual(providedBuf, expectedBuf);
}

export const POST: APIRoute = async ({ request }) => {
  if (!REVALIDATE_SECRET) {
    return new Response(
      JSON.stringify({ status: "error", message: "REVALIDATE_SECRET is not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const providedSecret = request.headers.get("X-Revalidate-Secret");
  if (!providedSecret || !secretsMatch(providedSecret, REVALIDATE_SECRET)) {
    return new Response(
      JSON.stringify({ status: "error", message: "Invalid or missing secret" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  purgeCache();

  return new Response(
    JSON.stringify({ status: "ok", purged: true }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};
