# Action Plan — airlineslocations.com

Prioritized fix list from the full SEO audit (see `FULL-AUDIT-REPORT.md` for evidence and context). This site is pre-launch and correctly gated behind `STAGING=true`; Phase 1 is the go-live checklist — do not flip `STAGING=false` until every item in Phase 1 is done.

---

## Phase 1 — Critical: Pre-Launch Blockers
*Must be fixed before `STAGING=false`. Ship-blocking.*

- [ ] **Replace Lorem Ipsum body content with real, verified office data** (address, phone, hours) on all 6 published location pages. This is the single most important item in the entire audit — it is the site's core content product.
- [ ] **Remove or complete the fabricated `FAQPage` schema** (`"question 1"`/`"answer 1"`) on the Algiers office page.
- [ ] **Kill the `/home` duplicate homepage** — delete the WordPress "Home" page, or add `"home"` to `RESERVED_SLUGS` in `src/lib/wp.ts`.
- [ ] **Delete the default "Hello world!" WordPress post** and remove it from the homepage's "Latest Blog Posts" section. Scrub the personal Gmail byline (`gradyrpollock@gmail.com`) and the CMS-origin `sameAs` disclosure from public author schema.
- [ ] **Fix the JSON-LD image domain bug** — `ImageObject`/`thumbnailUrl` must resolve to `cms.airlineslocations.com`, not the 404ing frontend path.
- [ ] **Replace the placeholder phone number(s)** sitewide and change every "Call Now" link from `href="#"` to a real `tel:` link.
- [ ] **Upload real, location-specific images** for all 6 location pages (5 currently show a broken placeholder icon).
- [ ] **Flip `STAGING=false` and rebuild** — confirm the noindex meta tag clears on `/` and `/404` specifically (not just SSR pages), `robots.txt` serves `Allow: /` plus a `Sitemap:` line.

---

## Phase 2 — High-Impact Structural & Technical Fixes
*Week 1–2 post-launch, or pre-launch if timeline allows.*

- [ ] 301-normalize trailing-slash and case-variant URLs to one canonical lowercase form.
- [ ] Add `LocalBusiness`/`TravelAgency` schema per office page and `Organization` schema per airline hub page (templates in `findings/schema.md`), gated on real NAP data.
- [ ] Add an **"Office Details" component** (address, hours, map slot) to the location-page template — the single biggest SXO structural gap; resolves the two weakest user personas simultaneously.
- [ ] De-duplicate the two conflicting `BreadcrumbList` schema blocks emitted on every content page.
- [ ] Fix `http://` `og:image`/`twitter:image` URLs to `https://`.
- [ ] Fix double-encoded HTML entities in meta descriptions and body copy.
- [ ] Set a real `Cache-Control` (not `no-store`) on the prerendered homepage so Hostinger's edge CDN can cache it.
- [ ] **Test Google PSI against a public build.** If it 403s the same way Lighthouse did in this audit, get Hostinger to allowlist Google's fetchers (PSI, Search Console) at the `hcdn` WAF layer before relying on any CWV reporting.

---

## Phase 3 — Content & Authority Depth
*Month 2.*

- [ ] Add a real FAQ section with `FAQPage` schema, matching the strongest competitor template pattern (`flyoffices.com`).
- [ ] Add a Head Office/HQ pointer block on location pages for misrouted searchers.
- [ ] Replace the irrelevant "related pages" link pattern with a real nearby/related-offices module.
- [ ] Add meta descriptions to all location pages once real content exists.
- [ ] **Establish a required-fields publish gate in the CMS** — no location page should be publishable without real phone/address/hours. Do this now, at only 6 pages, before volume scales.
- [ ] Add `llms.txt` mirroring the existing `robots.txt.ts`/`sitemap.xml.ts` pattern.

---

## Phase 4 — Monitoring & Iteration
*Ongoing.*

- [ ] Re-run the Backlinks check post-launch once the site is crawlable and indexed.
- [ ] Configure a free Moz API key for ongoing backlink monitoring.
- [ ] Re-run full Core Web Vitals lab measurement once the `hcdn`/headless-Chrome 403 is resolved.
- [ ] Add `<lastmod>` to the sitemap, sourced from WordPress's `modified` field.
- [ ] Add `/airlines` and `/blog` to the sitemap generator's static-route list.
- [ ] **Re-audit every future location page against this checklist before publish** — the placeholder-content pattern was confirmed systemic (template-level), not a one-off, so new pages are at the same risk until the CMS publish gate (Phase 3) is in place.
