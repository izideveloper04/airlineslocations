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
