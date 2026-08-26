# SEO Audit — airlineslocations.com

**Audit date:** 2026-08-26
**Business type:** Pre-launch programmatic directory (airline office locations worldwide) — Astro frontend + headless WordPress CMS, hosted on Hostinger
**Overall SEO Health Score: 30 / 100**

> **Read this first.** The site is currently pre-launch and correctly blocked from all crawlers (`robots.txt: Disallow: /` plus a site-wide `noindex,nofollow` meta tag), driven by a single `STAGING` environment flag. That gate is working as designed — the low health score below is **not** "why aren't we ranking," it's a pre-launch content-completeness and structural QA snapshot of what would ship the moment that gate is lifted. Several findings are genuine code bugs independent of the staging state (a duplicate `/home` page, a broken schema image domain, fabricated FAQ schema); those need fixing regardless of launch timing.

---

## Executive Summary

### Top 5 Critical Issues
1. **All 6 published location pages contain literal Lorem Ipsum placeholder body copy and a fake phone number** (`+1-XXX-XXX-XXXX`, wired to a dead `href="#"` link) instead of real office data. This is the core "product" of the site and it is 100% placeholder.
2. **A fabricated `FAQPage` schema block** on the Algiers office page contains literal `"question 1"`/`"answer 1"` placeholder Q&A, live in production structured data — a policed spam pattern independent of thin content.
3. **`/home` is a leaked default WordPress page duplicating the real homepage**, with its own JSON-LD `@id` self-identifying *as* `https://airlineslocations.com/` — a real code bug (missing from `RESERVED_SLUGS`) that will create a live duplicate-homepage collision the moment `STAGING=false`.
4. **Structured data references an image domain that 404s** — `ImageObject`/`thumbnailUrl` point at `airlineslocations.com/wp-content/...` when the media actually lives at `cms.airlineslocations.com`, breaking rich-result image eligibility sitewide.
5. **The page template is missing every structural element Google's own SERPs reward for this query type** — real competitor analysis for "[Airline] [City] office" queries shows Google's AI-synthesized answers pull address/hours directly from competitor directory sites with address/hours/map/FAQ sections; the target template has none of these as component slots, independent of the placeholder-copy issue.

### Top 5 Quick Wins
1. Add `"home"` to `RESERVED_SLUGS` in `src/lib/wp.ts` (or delete the WP "Home" page) — kills the `/home` duplicate in one line.
2. Change "Call Now" links from `href="#"` to real `tel:` links — testable immediately, even with placeholder digits.
3. Fix the JSON-LD image domain bug so `ImageObject`/`thumbnailUrl` resolve to `cms.airlineslocations.com`.
4. Delete the default "Hello world!" WordPress post — it's currently live on the homepage, attributed to a real personal Gmail address.
5. Set a real `Cache-Control` (not `no-store`) on the statically prerendered homepage so Hostinger's edge CDN can actually cache it.

### Scoring by Category

| Category | Weight | Score |
|---|---|---|
| Technical SEO | 22% | 58/100 |
| Content Quality | 23% | 8/100 |
| On-Page SEO | 20% | 25/100 |
| Schema / Structured Data | 10% | 35/100 |
| Performance (CWV) | 10% | 50/100 |
| AI Search Readiness (GEO) | 10% | 8/100 |
| Images | 5% | 15/100 |

*Search Experience (SXO) and Backlinks are reported separately below — SXO scored 24/100 as a structural gap score (not part of the weighted total); Backlinks returned "insufficient data" (expected pre-launch, not scored).*

---

## Technical SEO — 58/100

**What works:** Full security header set (HSTS, CSP, X-Frame-Options, Permissions-Policy), HTTPS/HSTS enforced sitewide, clean www→apex resolution, SSR content with no JS-rendering barrier, valid sitemap.xml, correct 404 handling, no redirect chains, URL hierarchy correctly mirrors WordPress's parent/child structure.

**Critical**
- **robots.txt blocks all crawling** (`Disallow: /`) — intentional pre-launch gate via the `STAGING` flag, but the prerendered homepage/404 bake the `noindex` tag in at build time, so an env-only flip at launch **will not** clear it without a rebuild.
- **`/home` is a near-duplicate, thin-content page** — a leaked WordPress default page, empty body, self-canonicalizing, missing from `RESERVED_SLUGS`.
- **Structured data references a 404ing image domain** — `wp-content/uploads` paths resolved against the wrong host.

**High**
- Trailing-slash and case-variant URLs are not normalized — each self-canonicalizes to whatever was requested, creating unlimited duplicate URL variants.
- `og:image`/`twitter:image` served over insecure `http://`.
- Double-encoded HTML entities mangle meta descriptions and body copy (e.g. literal `&#8220;` instead of a curly quote).

**Medium**
- Sitemap missing `<lastmod>`; missing `/airlines` and `/blog` despite both being live and nav-linked.
- `Cache-Control: no-store` on the statically prerendered homepage — deliberate today (STAGING-flip safety), worth revisiting post-launch.
- Hero background image not preload-hinted (likely LCP element); hotlinked Unsplash image has no explicit dimensions (CLS risk).

**Low**
- Placeholder `href="#"` CTAs; missing OG image fallback on static/listing pages; minimal `WebSite` schema with no `SearchAction`.

---

## Content Quality — 8/100

**Overall E-E-A-T score: ~2/100** for the location-page template as currently populated. Trustworthiness (the highest-weighted E-E-A-T factor) scores ~3/100.

**Critical**
- **Lorem Ipsum placeholder content confirmed on all 6 location pages** — not an isolated bug. Every page shares the identical filler text and identical fake phone number, confirming this is a template/CMS default that was never replaced with real data for any published office.
- **Fabricated FAQ schema** (`"question 1"`/`"answer 1"`) on the Algiers page — real, policed spam pattern.

**High**
- **The default WordPress "Hello world!" post is live and visible** on the homepage's "Latest Blog Posts" section, publicly attributed to a real personal Gmail address (`gradyrpollock@gmail.com`) — a privacy exposure, not just a polish gap. Its author schema also discloses the headless CMS's origin URL.
- **Programmatic/scaled-content risk**: 6 near-identical template pages whose only unique element is the city name, with identical copy-pasted filler as "content," closely matches what Google's site reputation abuse / scaled content abuse policy is written to catch — a real risk if this pattern is replicated across the site's implied "worldwide directory" scale without real per-location data.

**Medium**
- 5 of 6 location pages have no real image at all.

**Recommendation:** do not lift the `noindex`/`robots.txt` gate until every published location page has real, verified contact data. This is the single most important gate in this entire audit.

---

## On-Page SEO — 25/100

**What works:** Title tags and H1s on location pages are well-formed and intent-matching; breadcrumb navigation is present and visible.

- **Critical** — Body section headings are literally Lorem Ipsum generator text ("The standard Lorem Ipsum passage, used since 1966"), self-identifying as placeholder to any visitor or crawler.
- **High** — Meta description is `null` on location pages, where every reviewed ranking competitor has one filled and keyword-rich.
- **Medium** — Related-page sidebar surfaces one geographically irrelevant link (Algiers, on a Paris page); footer disclaimer hardcodes "Federal Airports Authority of Nigeria (FAAN)" on a France page — a missing dynamic field, not a copy issue.
- **Low** — No Head Office/HQ pointer section for misrouted searchers.

---

## Schema & Structured Data — 35/100

**What works:** 100% JSON-LD (no deprecated Microdata/RDFa), valid `@context`/`@type`/date formats throughout, `WebPage`/`BreadcrumbList`/`WebSite` present consistently.

**Critical**
- Fabricated FAQPage content live in production JSON-LD (see Content Quality).

**High**
- `/home`'s `WebPage` node self-identifies via `@id`/`url` as `https://airlineslocations.com/` — a direct schema collision with the real homepage, on top of the duplicate-content issue.
- **No `LocalBusiness`/`Organization`/`TravelAgency` entity schema exists anywhere** — the single highest-value gap for a location directory. Ready-to-wire JSON-LD templates for both are in `findings/schema.md`, gated to activate only once real NAP data lands.

**Medium**
- Every content page except `/` emits **two conflicting `BreadcrumbList` graphs** (different root labels, different trailing-slash conventions) — needs de-duplication to one source.
- Schema `@id`/`url` trailing-slash doesn't match the actual served canonical URL.

**Low**
- Homepage's `WebSite` schema is a bare 118-byte stub with no `@id`/`SearchAction`, inconsistent with every other page.

---

## Performance (Core Web Vitals) — 50/100

Real lab LCP/INP/CLS could **not** be measured this session — see Tooling Note below. Scored on architecture + response-time signals only.

**High**
- **Homepage served with `Cache-Control: no-store` despite being fully static** — never cached at Hostinger's edge (`x-hcdn-cache-status: DYNAMIC`), every visit round-trips to origin. Highest-impact, lowest-effort fix identified in this audit.
- **Headless-Chrome (Lighthouse/PSI) requests get HTTP 403** from Hostinger's edge WAF, while plain HTTP fetches succeed cleanly — isolated to the edge layer, not the app (no bot-blocking logic found in `src/middleware.ts`). **This is a genuine launch risk**: if not specific to this audit's sandboxed environment, Google's own PageSpeed Insights and Search Console page-experience tooling could hit the same block post-launch, preventing anyone from ever getting a passing/measurable PSI run.

**Medium**
- WP-backed content pages run ~150–200ms slower TTFB than the static homepage, consistent with the per-request WordPress REST round-trip — eats directly into the LCP budget for those pages.

**Measured (curl, no JS):** Homepage TTFB ≈0.46s avg; WP-backed page TTFB ≈0.61s avg. Both within "good" territory in isolation, but neither benefits from edge caching.

**Action before launch:** test PSI against a public build; if it 403s the same way, get Hostinger to allowlist Google's fetchers at the WAF layer.

---

## Images — 15/100

- **High** — 5 of 6 location pages show a broken/placeholder image icon instead of real photography, visible on both the homepage grid and the airline hub page.
- **Medium** — No location-specific image slot exists in the page template at all (the only two `<img>` tags on a location page are the site logo, twice). Hotlinked Unsplash image on the homepage has no explicit dimensions (CLS risk).

---

## AI Search Readiness (GEO) — 8/100

**What works:** Server-side rendering means no CSR/JS barrier for AI crawlers once access opens; `datePublished`/`dateModified` are correctly wired into schema.

**Critical**
- robots.txt blocks every AI crawler indiscriminately (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot) — same root cause as the Technical SEO gate, tracked here for AI-answer-engine visibility specifically.
- No citable facts exist anywhere in location-page content — nothing for an AI answer engine to extract or cite.

**High**
- Phone number is a single sitewide constant, not per-office data — even once real addresses are added, the phone line will still read as one generic (and currently fake) number unless restructured.
- No labeled NAP block — free-form WordPress prose won't be reliably extractable even once real data lands, without a structural rewrite.
- No `LocalBusiness`/`Organization`/`ContactPoint` schema for AI surfaces to key off.

**Low**
- `llms.txt` is missing (optional, low-effort once content is real).

---

## Search Experience (SXO) — Gap Score 24/100

This category evaluated the page **template/structure** against real Google SERP behavior for representative queries ("Qatar Airways Paris office", "Turkish Airlines Miami office address phone") — not the placeholder copy itself (covered under Content Quality).

**Critical finding:** Google's top-10 organic results for this query family are dominated (9 of 10 reviewed) by a specific competitor template — a Local Page × Service Page × FAQ hybrid (`airlinesheadoffices.com`, `flyoffices.com`, and similar sites) with real-format address/phone/hours boxes, working `tel:` buttons, embedded maps, and FAQ sections running 400–950 words. **Google's own AI-synthesized answer for these queries pulled address and hours directly from this competitor corpus — not from official airline sources** — confirming these are exactly the fields Google's synthesis layer keys on.

The target page implements **0 of 5** required Local Page elements: no address field, no hours field, no map slot, no geo/LocalBusiness schema, and its one interactive element ("Call Now") links to `href="#"` rather than even a placeholder `tel:` link.

**Persona scores (all "Critical Mismatch"):** In-Person Visitor 10/100, HQ/Corporate Seeker 13/100, Skeptical Pre-Trip Researcher 28/100, Urgent Traveler 32/100, Comparison Shopper 34/100.

**Top structural fix:** add an "Office Details" component (address/hours/map + LocalBusiness schema) — this single change resolves the two lowest-scoring personas and closes the biggest page-type gap identified in the whole audit.

---

## Backlinks — Insufficient Data (expected, pre-launch)

Domain registered brand-new on 2026-08-14 via NameCheap (confirmed via WHOIS) — rules out any inherited spammy link history from a prior owner. Common Crawl shows the domain not yet present in its web graph, consistent with a pre-launch, robots-blocked site. No Moz/Bing Webmaster/DataForSEO credentials were configured in this environment, so no DA/PA or referring-domain data was available. Not a launch blocker; re-check once the site is indexed.

---

## Tooling Note: PSI/Lighthouse blocked by hosting WAF

Both the local Lighthouse run and the Google PageSpeed Insights API failed to render `airlineslocations.com` — Lighthouse's real headless Chrome got an HTTP 403 on every attempt (confirmed not a simple User-Agent filter; TLS/CDP automation fingerprinting from Hostinger's `hcdn` edge is the likely cause), while plain `curl` requests succeeded cleanly. **This should be verified against a public, non-sandboxed environment before launch** — if the block persists, it would prevent Google's own PSI and Search Console tooling from ever completing a page-experience assessment.

---

## Screenshots

Desktop, laptop, tablet, and mobile captures of the homepage, the Qatar Airways hub page, and the Qatar Airways Paris office page are saved under `screenshots/{homepage,hub,location}/{desktop,laptop,tablet,mobile}.png`.

## Full findings by category

See `findings/technical.md`, `findings/content.md`, `findings/schema.md`, `findings/sitemap.md`, `findings/performance.md`, `findings/visual.md`, `findings/geo.md`, `findings/sxo.md`, `findings/backlinks.md` for complete evidence, code references, and additional detail behind every finding summarized above.

See `ACTION-PLAN.md` for the prioritized, phased fix list.
