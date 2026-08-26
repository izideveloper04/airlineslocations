# Performance / Core Web Vitals — airlineslocations.com (pre-launch)

Date: 2026-08-26

## Tooling status (important — read first)

- **PSI API**: returned `"PSI rate limit exceeded (240 QPM / 25,000 QPD)"` on every attempt (mobile strategy, homepage). No dedicated Google API key is configured for this environment, so requests share Google's unauthenticated public quota, which was already exhausted. No PSI Lighthouse scores or CrUX field data were obtainable this session. (CrUX field data would likely 404 anyway — site is pre-launch/no public traffic yet.)
- **Local Lighthouse** (`npx lighthouse` 12.8.2, local Chrome 151 installed): **failed on both URLs with `Status code: 403`** when Lighthouse's real headless Chrome tried to navigate. Retried with `--disable-blink-features=AutomationControlled`, same result.
- **Root-cause isolation**: plain `curl` requests (no JS execution, no browser TLS/CDP fingerprint) succeeded with `200 OK` on both URLs, including with UA strings spoofed to `Chrome-Lighthouse` and `HeadlessChrome/151.0.0.0` — ruling out simple User-Agent string filtering. The skill's `render_page.py --mode auto` also fetched both pages successfully via its plain-HTTP "raw" mode (200 OK). `src/middleware.ts` in the repo contains no bot/403/user-agent logic. Together this points to **Hostinger's `hcdn` edge (WAF/bot-protection) fingerprinting and blocking real headless-Chrome navigation** (TLS/JA3 or CDP automation signals such as `navigator.webdriver`), independent of the app's own `STAGING` gate.
- **Consequence**: no lab LCP/INP(TBT)/CLS numbers, render-blocking-resource audit, DOM size count, or image-dimension audit could be captured in this session for either URL.
- **Launch-blocking risk to flag separately**: Google's own PageSpeed Insights service also drives a real headless-Chrome fetch server-side. If this edge-level bot block is not specific to the current pre-launch state, **PSI (and Search Console's page-experience tooling) may 403 the same way after launch**, which would prevent Google — and the site owner — from ever getting a passing/measurable PSI run. Recommend the team explicitly test PSI against a public build and, if it also 403s, get Hostinger to allowlist Google's Lighthouse/PSI fetcher (and Googlebot) at the `hcdn` WAF layer before going live.

## What could be measured: response-time / TTFB (curl, 3 runs each, no JS)

| Metric | Homepage `/` | WP page `/qatar-airways/qatar-airways-paris-office-in-france` |
|---|---|---|
| Rendering mode | Astro prerendered (static) | Astro SSR (Node), live WP REST API call per request through short in-memory cache |
| TTFB (`time_starttransfer`) | 0.407s / 0.540s / 0.439s (avg ≈ 0.46s) | 0.683s / 0.522s / 0.630s (avg ≈ 0.61s) |
| Total transfer time | 0.415s / 0.564s / 0.450s | 0.684s / 0.525s / 0.666s |
| HTML payload size | 14,963 bytes (br-compressed, per headers) | 11,701 bytes |
| `Cache-Control` | `no-store` | `no-store` |
| `x-hcdn-cache-status` | `DYNAMIC` | `DYNAMIC` |
| `x-hcdn-upstream-rt` (origin→edge) | 0.243s–0.310s across fetches | 0.157s |

Observations:
- The WP-backed page's TTFB runs **~150–200ms slower on average** than the homepage, consistent with the extra per-request WordPress REST API round trip even with the in-memory cache in front of it. This gap will widen under real user load or cache-cold conditions, and directly eats into the LCP budget for those pages.
- TTFB alone (0.4–0.7s) is within "TTFB good" territory (<0.8s) for both, but neither page is CDN-cached at the edge, so every visitor pays full origin latency — there is no edge-cache cushion for traffic spikes or slow client connections.

## Cache-Control / CDN finding (confirmed, high priority)

The homepage is architecturally static (Astro prerenders it at build time), yet it is served with `Cache-Control: no-store` and Hostinger's edge (`x-hcdn-cache-status: DYNAMIC`) never caches it — every homepage request round-trips to the Node origin instead of being served from `hcdn` edge cache. This:
- Adds unnecessary origin latency to every homepage visit (no edge-cache short-circuit), directly inflating TTFB and therefore LCP's resource-load-delay subpart, especially for visitors far from the origin.
- Wastes Hostinger CDN's caching capability entirely for the one page-type on the site that is cheapest to cache.
- Is architecturally unnecessary: the WP-backed pages legitimately need `no-store` (or a very short `s-maxage`) because content is live per-request; the static homepage does not.

**Recommendation (highest expected impact, low effort)**: set a real `Cache-Control` (e.g. `public, max-age=0, s-maxage=300, stale-while-revalidate=60` or similar) on the prerendered homepage response/headers so `hcdn` can serve it from edge cache, cutting homepage TTFB toward near-zero for repeat/edge-cached hits. Verify whether this is set in `astro.config.mjs` output headers, a Hostinger-specific `_headers`/server config, or the Node adapter's response — none of that was located as static config; the `no-store` value is currently either an adapter default or centrally set by hosting config and needs tracing to its source.

## Gaps / what still needs to be measured once tooling access is fixed

- Actual LCP, INP (or TBT as an INP proxy), and CLS lab values for both URL types.
- Render-blocking CSS/JS inventory, hero-image optimization (format/dimensions/preload), font-loading strategy, DOM element count, and third-party script impact — none inspected this session due to the Lighthouse 403 blocker.
- CrUX field data is not yet available (pre-launch, no real-user traffic) — re-run `crux_history.py` / `pagespeed_check.py` post-launch once traffic accrues.

## Next steps (priority order)

1. **Fix the `hcdn` 403-on-headless-Chrome block** (or confirm it's scoped only to this sandboxed environment) so Lighthouse/PSI can actually render the site — this blocks all further CWV lab measurement and is a launch risk if it also blocks Google's own PSI/Search Console fetchers.
2. **Set a cacheable `Cache-Control` header on the static homepage** so Hostinger's `hcdn` edge can cache it instead of marking it `DYNAMIC` on every hit; leave WP-backed pages on `no-store` (or a short `s-maxage`) since their content is genuinely live per-request.
3. Once (1) is resolved, re-run Lighthouse/PSI on both URL types to get real LCP/INP/CLS numbers and prioritize image/JS/font fixes from actual data rather than assumptions.
4. Investigate whether the WP REST API in-memory cache TTL can be extended or whether an edge/object cache layer (e.g., short `s-maxage` with `stale-while-revalidate`) could reduce the ~150-200ms per-request TTFB gap on WordPress-backed pages without serving stale content to editors.
