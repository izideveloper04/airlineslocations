# Sitemap Audit — airlineslocations.com

Audited: 2026-08-26
Source: `https://airlineslocations.com/sitemap.xml` (fetched live), `https://airlineslocations.com/robots.txt` (fetched live), `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `src/lib/wp.ts`, `src/lib/config.ts`, `README.md`

## Summary

The sitemap is generated dynamically (`src/pages/sitemap.xml.ts`, `prerender = false`) by combining one hard-coded static path (`""`, the homepage) with every page currently in the live WordPress page tree (`getPageTree().list`). It is well-formed XML and far under all size/count limits. However, it currently ships an unwanted duplicate URL (`/home`), is missing two legitimate hand-built pages (`/airlines`, `/blog`), and — because of the site-wide pre-launch `STAGING` gate — every single URL it lists is currently `noindex, nofollow` and blocked by `robots.txt`, making the sitemap fully inert until launch. None of this is urgent on its own (pre-launch, 10 URLs), but two items (`/home` duplicate, Lorem Ipsum/placeholder content on location pages) should be fixed **before** `STAGING` flips to `false`, not after.

## Validation Checks

| Check | Result | Notes |
|---|---|---|
| XML well-formed | ✅ Pass | Valid `<urlset>` root, correct `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`, UTF-8 declaration, all 10 `<url><loc>` entries close correctly. |
| Per-file limits (≤50,000 URLs / ≤50MB) | ✅ Pass | 10 URLs, 1,038 bytes. No index-sitemap needed at this scale. |
| `priority` / `changefreq` | ℹ️ Info | Neither present. Correct/harmless either way — Google ignores both. No action needed. |
| `lastmod` | ⚠️ Low | Absent on every entry. `src/pages/sitemap.xml.ts` only emits `<loc>`, no `<lastmod>`. Easy to add accurately later: `src/lib/wp.ts`'s `fetchAllPages()` only requests the WP REST `date` field (publish date), not `modified` (last-modified date) — would need to add `modified` to the `_fields` list and expose it on `WPPage`/`fullPath` entries to populate real, meaningful `lastmod` values (not just "regenerated at request time," which the endpoint's `Cache-Control: no-store` header could otherwise be mistaken for). |
| HTTP status of every listed URL | ✅ Pass | All 10 sitemap URLs return `200 OK` (verified via direct `curl`). No 404s, no redirects. |
| Noindexed URLs present in sitemap | 🛑 High | **All 10 of the 10 URLs currently in the sitemap** serve `<meta name="robots" content="noindex, nofollow">`. This is intentional and uniform — driven by the single `isStaging` flag in `src/lib/config.ts` (`STAGING` env var, defaults to `true`), consumed in `src/layouts/BaseLayout.astro:62`. Not a bug, but it means the sitemap is 100% non-functional for SEO purposes right now — see "robots.txt / launch-gate interaction" below. |
| Sitemap referenced from robots.txt | ⚠️ Medium (by design, pre-launch) | `src/pages/robots.txt.ts` only emits a `Sitemap:` line on the non-staging branch. While `STAGING=true`, `robots.txt` is exactly `User-agent: *\nDisallow: /\n` — no `Sitemap:` line at all, confirmed live. This is intentional staging behavior, not a defect, but must be verified to flip correctly at launch (see below). |
| URL pattern consistency vs. WP parent/child hierarchy (README requirement) | ✅ Pass (with one exception) | `qatar-airways/qatar-airways-algiers-office-in-algeria`, `qatar-airways/qatar-airways-paris-office-in-france` are correctly nested under `qatar-airways`; all 4 Turkish Airlines location pages are correctly nested under `turkish-airlines`. This matches `computeFullPath()` in `src/lib/wp.ts`, which walks the real WP ancestor chain — no drift between WP's hierarchy and the emitted URLs. The one exception is `/home` (see next finding), which is top-level by the same logic — not a routing bug, but an unwanted top-level WP page. |

## Critical/Notable Finding: `/` vs `/home` — not a canonicalization edge case, two distinct live pages

Root cause identified in code, not just symptom:

- `/` is the hand-built Astro static homepage (`src/pages/index.astro`), explicitly listed via `STATIC_PATHS = [""]` in `src/pages/sitemap.xml.ts`.
- `/home` is a **separate, real WordPress content page** — a top-level page (`parent: 0`, slug `home`) that WordPress's page tree contains, almost certainly WordPress's own leftover default page from initial install, never deleted or renamed by an editor. It is picked up automatically by `getPageTree()` in `src/lib/wp.ts` and rendered live through `src/pages/[...slug].astro`, and it is swept into the sitemap by the same `tree.list.map(...)` logic that (correctly) picks up the airline/location pages.
- Confirmed via live fetch: both `/` and `/home` return `200`, have **different `<title>`** ("Find Airlines and Their Locations Worldwide | Airlines Locations" vs. "Home - airlineslocations.com"), different body content, and **each self-canonicalizes to its own URL** (`/` → `https://airlineslocations.com/`, `/home` → `https://airlineslocations.com/home`) — i.e. there is no canonical tag pointing one at the other. This is a genuine duplicate-content pair, not a false alarm.
- Why the routing didn't already exclude it: `RESERVED_SLUGS = new Set(["", "api", "airlines", "blog"])` in `src/lib/wp.ts` (line 127) reserves the empty slug for the hand-built homepage and reserves `airlines`/`blog` for the other hand-built routes — but does **not** reserve `home`. Nothing stops a WP page slugged `home` from being treated as ordinary content.
- Currently masked by `noindex` (same STAGING-wide gate as everything else) — so no live indexing damage yet. But this is a landmine: the `noindex` meta and the sitemap-inclusion logic are two independent code paths (`isStaging` vs. `RESERVED_SLUGS`) that don't reference each other. When `STAGING` flips to `false` at launch, `/home` becomes indexable exactly as-is unless fixed first, and it will compete with `/` for the homepage query/brand-term ranking.

**Recommended fix (pick one, before launch):**
1. Delete the orphan "Home" page from wp-admin entirely (cleanest — it appears to be unused, and its content differs from the real homepage, so it isn't serving any editorial purpose); or
2. If it must stay, add `"home"` to `RESERVED_SLUGS` in `src/lib/wp.ts` so it's excluded from the tree/routing/sitemap the same way `airlines`/`blog` already are; or
3. At minimum, add a canonical from `/home` → `/` and manually exclude `/home` from `sitemap.xml.ts`.

Option 1 or 2 is preferred — a redirect/canonical band-aid still leaves a live, differently-titled duplicate page reachable and indexable via internal/external links.

## Coverage Gaps

**Missing from sitemap (live, 200, should be added):**
- `/airlines` — hand-built Astro search/directory page (`src/pages/airlines.astro`), real `200`, not staging-blocked beyond the site-wide noindex. `sitemap.xml.ts`'s `STATIC_PATHS` array only contains `[""]` (comment on line 10 flags "add other hand-built landing pages here as they're added" — this is a manual step that was missed for `/airlines` and `/blog`).
- `/blog` — hand-built blog listing page (`src/pages/blog.astro`), same gap.

**Missing from sitemap, but should be deleted rather than added:**
- `/blog/hello-world` — a live `200` URL. Confirmed to be WordPress's default "Hello world!" sample post (title, boilerplate content), still published and unedited. `sitemap.xml.ts` doesn't currently pull blog posts into the sitemap at all (only `getPageTree()`, not `getPosts()`), so this isn't erroneously exposed via the sitemap — but it is a live, crawlable, indexable-once-STAGING-flips URL that should be **deleted from wp-admin** before launch, same class of issue as `/home`. If real blog posts are added later, wire `getPosts()` into `sitemap.xml.ts` at that point.

**Net effect:** actual live `200` URLs on the site total 13 (`/`, `/home`, `/airlines`, `/blog`, `/blog/hello-world`, 2 airline hubs, 6 location children) against 10 in the sitemap — the sitemap both over- and under-represents the real site (includes an unwanted page, omits two wanted ones).

## robots.txt / Launch-Gate Interaction

- Live `robots.txt` right now: `User-agent: *\nDisallow: /\n` — confirmed via direct fetch, matches the intentional `STAGING=true` pre-launch gate in `src/lib/config.ts`.
- Because of this, submitting or polishing the sitemap has **zero SEO effect today** — every URL it lists is both `noindex`'d and disallowed from crawling. This is expected and by design, not a defect to fix in isolation.
- All three staging-gate mechanisms (robots.txt `Disallow: /`, per-page `noindex` meta in `BaseLayout.astro`, and `Cache-Control: no-store` on the dynamic endpoints) are driven off the single `STAGING` env var, which is good architecture — low risk of one flipping without the others.
- **Recommendation:** treat "flip `STAGING=false` at launch" and "sitemap cleanup" as one combined go-live checklist item, not two sequential ones. Specifically, fix the `/home` duplicate and verify location-page content is real (see next section) *before* flipping `STAGING`, so day-one indexing doesn't immediately expose a duplicate homepage and Lorem-Ipsum location pages to Google.

## Location Page Quality Gate (forward-looking)

- Current count: **6 location child pages** (2 under `qatar-airways`, 4 under `turkish-airlines`). Well under the 30-page WARNING threshold and the 50-page HARD STOP defined by this skill's quality gates — no gate trips today.
- Content-quality spot check on `qatar-airways/qatar-airways-paris-office-in-france` (as flagged by the requester) confirmed:
  - Body copy is literal, unedited **Lorem Ipsum placeholder text** ("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...").
  - The phone/call-card widget displays the literal placeholder string **`+1-XXX-XXX-XXXX`**, not a real number (same placeholder pattern also present in the homepage hero's "Call Now" button).
  - Same templated page structure is used for all 6 current location children, so the other 5 should be assumed to have the same placeholder content until spot-checked individually.
- **Recommendation:** this is the ideal moment — only 6 location pages exist — to put a real go-live gate in place before this number grows: e.g., a required-fields check on the location/child WP template (no page publishable/sitemap-eligible without real address, hours, and phone fields filled in), or a manual QA pass per page before each is allowed into the sitemap and before `STAGING` flips. Retrofitting quality across dozens of location pages after they're indexed is far more expensive than gating it now. This directly matches this skill's "Penalty Risk" bucket: templated city-swapped location pages with no real per-location content are a doorway-page risk once indexed — Lorem Ipsum body copy and a placeholder phone number are about as close to the worst-case version of that pattern as it gets, so nothing here should be indexed as-is regardless of page count.
- No HARD STOP is being invoked at this time (page count is far below 50), but flag this explicitly as a **pre-launch blocker for indexing this specific content**, independent of the page-count gate.

## Recommended Fix Priority

1. **Before `STAGING=false`:** Fix `/home` duplicate (delete WP page or add to `RESERVED_SLUGS`).
2. **Before `STAGING=false`:** Replace Lorem Ipsum / placeholder phone numbers on all 6 location pages (and homepage hero's placeholder "Call Now" number) with real content, or keep those specific pages `noindex`/excluded until real content lands even after other pages go live.
3. **Before `STAGING=false`:** Delete the default "Hello world!" WP post (or replace with real content).
4. Add `/airlines` and `/blog` to `STATIC_PATHS` in `src/pages/sitemap.xml.ts`.
5. Low priority / whenever convenient: add `modified` to the WP REST `_fields` fetch and emit real `<lastmod>` values in the sitemap.
6. At launch: confirm `robots.txt`'s `Sitemap:` line, the removal of `Disallow: /`, and the removal of the `noindex` meta all flip together (they already share one `STAGING` flag, so this should just be a verification step, not new code).

## Findings (structured)

```json
{
  "category": "Sitemap",
  "url_audited": "https://airlineslocations.com/sitemap.xml",
  "findings": [
    {
      "id": "sitemap-xml-valid",
      "severity": "pass",
      "title": "Sitemap XML is well-formed",
      "detail": "Valid urlset, correct namespace, UTF-8 declared, 10 <url> entries, all close correctly."
    },
    {
      "id": "sitemap-size-limits",
      "severity": "pass",
      "title": "Well under 50,000 URL / 50MB per-file limit",
      "detail": "10 URLs, 1038 bytes."
    },
    {
      "id": "sitemap-all-noindexed",
      "severity": "high",
      "title": "All 10 sitemap URLs are noindex,nofollow",
      "detail": "Driven by STAGING flag (src/lib/config.ts) via BaseLayout.astro:62. Intentional pre-launch gate, but means sitemap is currently inert for SEO. Must be verified to lift in sync with STAGING=false at launch."
    },
    {
      "id": "robots-disallow-all",
      "severity": "medium",
      "title": "robots.txt currently Disallow: / and omits Sitemap: line",
      "detail": "Intentional STAGING gate (src/pages/robots.txt.ts). Sitemap: line only emitted on STAGING=false branch. Flag for combined go-live checklist with sitemap cleanup."
    },
    {
      "id": "home-duplicate-page",
      "severity": "high",
      "title": "/home is a separate, live WordPress page duplicating / (homepage)",
      "detail": "Root cause: RESERVED_SLUGS in src/lib/wp.ts does not include 'home'. / is the hand-built Astro homepage (index.astro); /home is an orphan top-level WP page (likely WP's default install page), different title/content, self-canonicalizing (no cross-canonical). Currently masked by site-wide noindex but will become indexable at launch unless fixed. Fix: delete the WP page, or add 'home' to RESERVED_SLUGS, before STAGING=false."
    },
    {
      "id": "missing-airlines-blog",
      "severity": "medium",
      "title": "/airlines and /blog (hand-built pages) missing from sitemap",
      "detail": "sitemap.xml.ts STATIC_PATHS only contains [\"\"]. Both pages return 200 and are legitimate crawlable routes."
    },
    {
      "id": "hello-world-default-post",
      "severity": "medium",
      "title": "Default WordPress 'Hello world!' sample post still published",
      "detail": "Live at /blog/hello-world, 200, noindex (staging-wide). Should be deleted from wp-admin before launch rather than left published."
    },
    {
      "id": "lastmod-missing",
      "severity": "low",
      "title": "No <lastmod> on any sitemap entry",
      "detail": "src/lib/wp.ts only fetches WP REST 'date' (publish date), not 'modified'. Add 'modified' field to enable accurate <lastmod>."
    },
    {
      "id": "priority-changefreq-absent",
      "severity": "info",
      "title": "priority/changefreq correctly absent",
      "detail": "Both ignored by Google; no action needed."
    },
    {
      "id": "location-page-placeholder-content",
      "severity": "high",
      "title": "Location child pages contain Lorem Ipsum body copy and placeholder phone numbers",
      "detail": "Confirmed on qatar-airways/qatar-airways-paris-office-in-france: literal Lorem Ipsum paragraph and literal '+1-XXX-XXX-XXXX' phone placeholder. Same template used for all 6 current location pages. Must be replaced with real per-location content before indexing; matches skill's doorway-page/Penalty-Risk pattern for city-swapped location pages."
    },
    {
      "id": "location-page-count-gate",
      "severity": "info",
      "title": "Location page count (6) is well below WARNING (30) and HARD STOP (50) thresholds",
      "detail": "No quantity gate triggered. Recommend establishing a content-completeness gate now (only 6 pages) before volume scales, given placeholder-content finding above."
    },
    {
      "id": "url-hierarchy-matches-wp",
      "severity": "pass",
      "title": "Sitemap URL nesting matches WordPress parent/child hierarchy per README",
      "detail": "All qatar-airways/* and turkish-airlines/* location URLs correctly nested under their airline hub, matching computeFullPath() ancestor-walk logic. Only exception is /home (see home-duplicate-page finding), which is a content issue, not a routing/URL-pattern bug."
    }
  ]
}
```
