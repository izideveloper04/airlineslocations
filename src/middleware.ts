import { defineMiddleware } from "astro:middleware";

// Applies to every route — every page in this project is `prerender = false`
// (SSR), so nothing skips this pipeline today. If a page is ever flipped to
// static/prerendered, it *would* skip this (Astro middleware doesn't run for
// prerendered output, which is built to static HTML and served directly) —
// worth remembering since the www-redirect below only works for requests
// that actually reach the Node process.

// www vs. non-www: whichever SITE_URL specifies is canonical (same source
// the sitemap/canonical tags already use — see astro.config.mjs), and the
// other variant 301s to it. Currently non-www — deliberately matching
// Hostinger's own edge/CDN, which already 301s www -> non-www for this
// domain ahead of the app, independent of anything in this repo. Fighting
// that (trying to make www canonical here) just produces a redirect loop
// between this middleware and Hostinger's edge. If that upstream redirect
// is ever removed, swap SITE_URL to the www host to flip the direction;
// no other code change needed. In local dev SITE_URL defaults to
// http://localhost:4321, whose "alternate" (www.localhost) never actually
// gets requested, so this is a no-op there.
const siteUrl = process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;
const canonicalHost = siteUrl?.hostname;
const alternateHost = canonicalHost
  ? canonicalHost.startsWith("www.")
    ? canonicalHost.slice(4)
    : `www.${canonicalHost}`
  : undefined;

// getPageByPath (src/lib/wp.ts) normalizes case/leading-and-trailing slashes
// before looking a path up in the page tree, so "/EVA-AIR", "/eva-air/", and
// "//eva-air" all successfully resolve to the same page instead of 404ing —
// each was serving 200 with its own self-referencing canonical rather than
// redirecting to the one true form, real duplicate-content surface once the
// site is indexed. Redirect those variants to the canonical form here
// instead. Skipped for build assets (/_astro/*, hashed filenames are
// case-sensitive), /api/* (a 301 on a non-GET request breaks the body), and
// /_image (its case-sensitive encoded source URL lives in the query string,
// which this only reads past, never rewrites — see NORMALIZE_SKIP_EXACT).
const NORMALIZE_SKIP_PREFIXES = ["/_astro/", "/api/"];
const NORMALIZE_SKIP_EXACT = new Set(["/_image"]);

function normalizedPathname(pathname: string): string | null {
  if (NORMALIZE_SKIP_EXACT.has(pathname) || NORMALIZE_SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }
  // A dot in the last segment means a static file (favicon.ico,
  // robots.txt, a stray asset) — leave filenames' casing alone.
  const lastSegment = pathname.split("/").pop() ?? "";
  if (lastSegment.includes(".")) return null;

  const collapsed = pathname.replace(/\/{2,}/g, "/").toLowerCase();
  const normalized = collapsed.length > 1 && collapsed.endsWith("/") ? collapsed.slice(0, -1) : collapsed;
  return normalized === pathname ? null : normalized;
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (alternateHost && siteUrl && context.url.hostname === alternateHost) {
    const target = new URL(context.url);
    target.hostname = siteUrl.hostname;
    // Force https (siteUrl's own protocol) rather than reusing
    // context.url's — behind Hostinger's reverse proxy, SSL is terminated
    // at the proxy and the Node process sees a plain-http connection even
    // when the real visitor came in over https, so copying context.url's
    // protocol here would redirect everyone to http://www... instead.
    target.protocol = siteUrl.protocol;
    return context.redirect(target.toString(), 301);
  }

  const normalized = normalizedPathname(context.url.pathname);
  if (normalized) {
    const target = new URL(context.url);
    target.pathname = normalized;
    return context.redirect(target.toString(), 301);
  }

  const response = await next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  // Scoped to this domain only (no includeSubDomains) — cms.* is a separate
  // WordPress install this repo doesn't control; forcing HSTS onto it from
  // here would be a surprising, hidden side effect if it's ever misconfigured.
  response.headers.set("Strict-Transport-Security", "max-age=63072000");

  return response;
});
