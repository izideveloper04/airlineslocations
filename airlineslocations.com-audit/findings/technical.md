# Technical SEO Findings — airlineslocations.com

Audit date: 2026-08-26. Pre-launch site (STAGING=true). Crawl performed with robots.txt bypassed by design (authorized self-audit) but robots.txt/noindex behavior is still evaluated and reported below since it governs real crawler access today.

**Coverage note:** All 10 sitemap.xml URLs were fetched (HTTP status confirmed 200 for all). Head/meta/schema were deep-inspected on: `/`, `/home`, `/airlines`, `/blog`, `/blog/hello-world`, `/qatar-airways`, `/qatar-airways/qatar-airways-algiers-office-in-algeria`, `/turkish-airlines/turkish-airlines-miami-office-in-florida`. The remaining sitemap URLs (`/qatar-airways/qatar-airways-paris-office-in-france`, `/turkish-airlines`, `/turkish-airlines/turkish-airlines-leipzig-office-in-germany`, `/turkish-airlines/turkish-airlines-nouakchott-office-in-mauritania`, `/turkish-airlines/turkish-airlines-nuremberg-office-in-germany`) were confirmed 200 OK but not individually deep-inspected for meta/schema — given they share the same `[...slug].astro` template and WP/Yoast pipeline as the pages that were inspected, the template-level findings below (structured-data domain bug, trailing-slash/case duplication, entity-encoding) should be assumed to apply to them too until spot-checked.

---

## Critical

### 1. robots.txt blocks all crawling (`Disallow: /`) — intentional pre-launch gate, but must not ship this way
- **Evidence:** `https://airlineslocations.com/robots.txt` returns `User-agent: *\nDisallow: /`. Confirmed in source (`src/pages/robots.txt.ts`) this is driven by `STAGING` (defaults to `true` when unset — "can't accidentally ship open by omission"). Site-wide `<meta name="robots" content="noindex, nofollow">` is also injected on every page (confirmed on all 8 pages inspected) via `BaseLayout.astro`.
- **Impact:** Real search engines cannot crawl or index anything today. This is correct for pre-launch but is a hard blocker at launch time if forgotten.
- **Recommendation:** At launch: set `STAGING=false` in Hostinger's Node.js App env panel **and rebuild** (the code comment notes the prerendered homepage/404 bake the noindex meta tag in at build time — an env-only flip without a rebuild will not clear it from those two routes even though SSR content pages would pick it up live). Verify post-launch that `robots.txt` serves `Allow: /` + `Sitemap:` line, and that the noindex meta tag is gone from a curl of `/` specifically (not just an SSR page).

### 2. `/home` is a near-duplicate, thin-content page competing with the real homepage
- **Evidence:** `/home` is in sitemap.xml and returns 200. It resolves through the WP content-page template (not the hand-built Astro homepage) — breadcrumb "AirlinesLocations / Home", `<h1>Home</h1>`, and an **empty** `<div class="prose"></div>` (no body content at all). It has its own self-referencing canonical (`https://airlineslocations.com/home`) and a generic Yoast-default title (`Home - airlineslocations.com`) / OG title, distinct from the real homepage's title (`Find Airlines and Their Locations Worldwide | Airlines Locations`).
- **Impact:** This is a leftover default WordPress page (likely WP's sample "Home" page) leaking into the page tree and getting indexed as a separate, thin, near-empty URL once `STAGING=false`. Duplicate-content and thin-content risk simultaneously; also wastes crawl budget and confuses the site's information architecture.
- **Recommendation:** Delete or unpublish the WP "Home" page before launch, or if it must exist in WP, exclude it from `sitemap.xml.ts`'s page-tree walk and add a hard 301 redirect `/home → /` at the routing layer so no duplicate URL is ever reachable.

### 3. Structured data (JSON-LD) references a domain that 404s
- **Evidence:** On `/qatar-airways/qatar-airways-algiers-office-in-algeria`, the Yoast `@graph` JSON-LD block's `ImageObject` (`url`, `contentUrl`, and the parent `WebPage`'s `thumbnailUrl`) point to `https://airlineslocations.com/wp-content/uploads/2026/08/arr-dep.webp`. This path does not exist on the Astro frontend domain — confirmed **404** via direct fetch. The actual media file only exists at `https://cms.airlineslocations.com/wp-content/uploads/2026/08/arr-dep.webp` (confirmed 200), which is what's correctly used elsewhere on the same page (`og:image`, `twitter:image`, and the visible `<img>` tags).
- **Root cause:** The full Yoast JSON-LD `@graph` appears to be passed through largely verbatim rather than going through the same `SITE_URL`/`WP_API_URL` domain resolution applied to title/OG/canonical fields (per `IMPLEMENTATION.md` §8), so WP-relative image paths get rewritten to the wrong (frontend) domain instead of the WP media domain.
- **Impact:** Breaks image references for any rich-result eligibility (FAQPage, ImageObject) tied to this schema — Google will fail to fetch the referenced image. Likely affects every WP content page, not just this one.
- **Recommendation:** Either (a) suppress/strip Yoast's raw `@graph` JSON-LD entirely and have Astro emit its own minimal, correctly-domained schema (WebPage/BreadcrumbList/FAQPage as needed), consistent with how title/OG/canonical are already hand-resolved, or (b) if passing Yoast's JSON-LD through, rewrite all `cms.airlineslocations.com`-relative media URLs inside it the same way OG image URLs are handled.

---

## High

### 4. Duplicate URL variants: trailing slash and case are not normalized
- **Evidence:** `https://airlineslocations.com/qatar-airways/qatar-airways-algiers-office-in-algeria` (sitemap form, no trailing slash) and the same URL **with** a trailing slash both return 200 with identical content — but each **self-canonicalizes to whatever variant was requested** (no-slash canonical → no-slash URL; slash canonical → slash URL). Same behavior confirmed for case: `/Qatar-Airways` (mixed case) returns 200 with title/content identical to `/qatar-airways`, and its canonical tag is `https://airlineslocations.com/Qatar-Airways` — i.e., it self-canonicalizes to the wrong-case URL rather than the sitemap's lowercase form.
- **Impact:** Effectively unlimited duplicate-content URL variants per content page (any case combination × trailing slash), each treated by the site as its own canonical URL. Search engines may index multiple copies of the same page and split link/ranking signals.
- **Recommendation:** Normalize at the routing layer: 301-redirect any request with a trailing slash or non-canonical case to the single lowercase, no-trailing-slash form that matches `sitemap.xml`, before the canonical tag is even computed. Do not rely on the canonical tag alone to declare a preference — self-canonicalizing to whatever was requested defeats the purpose.

### 5. `og:image` / `twitter:image` served over insecure `http://`
- **Evidence:** On the Algiers office page, `<meta property="og:image" content="http://cms.airlineslocations.com/wp-content/uploads/2026/08/arr-dep.webp">` and the matching `twitter:image` — both `http://`, not `https://`, despite the file being reachable over HTTPS (confirmed 200 on `https://cms.airlineslocations.com/...`).
- **Impact:** Some social/crawler platforms downgrade or reject insecure image URLs in previews; inconsistent with the site's HSTS/CSP `upgrade-insecure-requests` posture used everywhere else.
- **Recommendation:** Force `https://` when resolving `og_image[0].url` from Yoast in `resolvePageMeta()`, or configure Yoast/WP `siteurl` to HTTPS so it's already correct at the source.

### 6. HTML entities double-encoded in meta descriptions (Lorem-Ipsum placeholder content also live)
- **Evidence:** `og:description`/`twitter:description` on office pages render as `The standard Lorem Ipsum passage, used since 1966 &#38;#8220;Lorem ipsum dolor sit amet...[&#38;hellip;]` — the `&` of WP's original entities (`&#8220;`, `&hellip;`) has been re-escaped to `&#38;`, so browsers/crawlers will display the literal text `&#8220;` and `&hellip;` instead of a curly quote and ellipsis. Same mangling visible in on-page body copy (mojibake `â€¦`/`â` characters in nav placeholder text "Search airlinesâ¦", "Read Article â"). Separately, all crawled office pages (Algiers, Miami, and by template inheritance likely all others) contain **Lorem Ipsum placeholder body copy**, not real office information — this is pre-launch content, not yet an SEO defect, but must not ship live.
- **Impact:** Double-encoded entities will show broken characters in SERP snippets and social previews once indexed — looks unpolished/untrustworthy.
- **Recommendation:** Ensure Yoast description/title strings are decoded once (not re-escaped) when interpolated into `<meta content="...">` attributes; audit the OG/twitter description resolution path for a double `htmlEscape()` call. Separately, replace all Lorem Ipsum content with real office copy before `STAGING=false`.

---

## Medium

### 7. Sitemap.xml is minimal — missing `<lastmod>`, and missing pages that exist and are internally linked
- **Evidence:** `sitemap.xml` (10 URLs, valid `urlset`, confirmed via `sitemap_discovery.py`) has no `<lastmod>`, `<changefreq>`, or `<priority>` on any entry. It also does not include `/airlines` or `/blog` — both of which exist (200 OK) and are linked from the global header nav and footer on every page — nor `/blog/hello-world`, which is linked from the homepage's "Latest Blog Posts" section.
- **Impact:** Missing `<lastmod>` reduces re-crawl efficiency signals once live. `/airlines` and `/blog` are not literally orphaned (they're linked in global nav), but their absence from the sitemap is an inconsistency worth resolving — likely because they're static/landing-style Astro routes outside the WP page-tree walk that generates `sitemap.xml.ts`.
- **Recommendation:** Add `<lastmod>` sourced from WP's `modified`/`modified_gmt` field (already available per §8) for content pages. Decide whether `/airlines` and `/blog` are meant to be indexable long-term and, if so, add them to the sitemap generator's static-route list.

### 8. `robots.txt` has no `Sitemap:` line even in the current (staging) response
- **Evidence:** Current `robots.txt` body is exactly `User-agent: *\nDisallow: /` with no `Sitemap:` reference — confirmed this is by design (the `isStaging` branch in `robots.txt.ts` intentionally omits it since a blocked site shouldn't advertise a sitemap). The non-staging branch does correctly add `Sitemap: {SITE_URL}/sitemap.xml`.
- **Impact:** None today (correct for staging); flagging only so it's explicitly verified as part of the launch checklist alongside Critical #1.
- **Recommendation:** No code change needed — just confirm the non-staging branch output post-flip (`User-agent: *\nAllow: /\n\nSitemap: https://airlineslocations.com/sitemap.xml`).

### 9. `Cache-Control: no-store` on all responses, including the statically prerendered homepage
- **Evidence:** Homepage response headers show `Cache-Control: no-store` despite `index.astro` being prerendered to static HTML at build time. Code comments (`robots.txt.ts`, and by the same stated pattern `sitemap.xml.ts`/`[...slug].astro`) confirm this is deliberate — chosen specifically to avoid a CDN caching a `Disallow: /` (or the inverse) across a `STAGING` flip.
- **Impact:** This is a reasonable tradeoff pre-launch, but `no-store` on a genuinely static asset (the homepage HTML) forfeits CDN/browser caching benefits for Core Web Vitals (repeat-visit LCP, TTFB) once the site is live and `STAGING` is no longer flipping.
- **Recommendation:** Post-launch, revisit whether the prerendered homepage/404 specifically can move to a short `max-age` + `stale-while-revalidate` policy (or at least `no-cache` instead of `no-store` for revalidation) now that the STAGING-flip risk window has closed, while leaving `no-store` on the genuinely dynamic SSR routes (`sitemap.xml`, `robots.txt`, `[...slug].astro`, `/api/flight-search`).

### 10. Hero background image not preload-hinted; likely LCP element
- **Evidence:** Homepage hero section uses a CSS `background-image:url(/_astro/airpp.D1nfR2Oi.webp)` inline style. No `<link rel="preload" as="image">` for it in `<head>`. It sits above the fold as the largest visual element on the page.
- **Impact:** As a CSS background image (discovered only after CSSOM construction, not by the HTML preload scanner), this is a common LCP-delay pattern — the browser can't start fetching it until CSS is parsed, unlike an `<img>` with `fetchpriority="high"`.
- **Recommendation:** Either preload it explicitly (`<link rel="preload" as="image" href="/_astro/airpp....webp">`) or convert the hero visual to an `<img>` with `fetchpriority="high"` (as already done correctly for the header logo) so it's discoverable by the preload scanner.

### 11. Third-party hotlinked image with no dimensions (CLS risk)
- **Evidence:** Homepage "About Us" section: `<img src="https://images.unsplash.com/photo-1526778548025-...` — no `width`/`height` attributes (unlike every other `<img>` on the page, which all carry explicit `width`/`height`). It is `loading="lazy"`, so less LCP-relevant, but the missing intrinsic size means layout can shift as it loads.
- **Recommendation:** Set explicit `width`/`height` (or `aspect-ratio` via CSS) on this image; consider self-hosting it instead of hotlinking Unsplash for a production site (reliability + no third-party dependency).

---

## Low

### 12. Placeholder dead links (`href="#"`) and placeholder phone number in production markup
- **Evidence:** Homepage hero CTA `<a href="#" class="btn btn-primary">Call Now: +1-XXX-XXXX-XXX</a>` and About section `<a href="#" class="btn btn-primary">Learn About Us</a>`.
- **Impact:** Not a crawl-breaking issue (no new URL is created), but these are unfinished placeholders that must not ship live — dead internal links and a fake phone number hurt trust/UX and could be flagged by users or reviewers.
- **Recommendation:** Wire up real destinations before launch (tel: link for the phone CTA, real About page for the second).

### 13. Missing `og:image`/`twitter:image` on non-WP static/listing pages
- **Evidence:** Homepage, `/airlines`, `/blog`, and `/qatar-airways` (parent listing page) all have `og:title`/`og:description` but no `og:image` or `twitter:image` meta tag at all (unlike the WP office detail pages, which do have one).
- **Impact:** Social shares of the homepage or category pages will show no preview image.
- **Recommendation:** Add a default/fallback OG image (e.g. site logo or a branded card) in `BaseLayout.astro` for pages without a WP-sourced image.

### 14. `WebSite` JSON-LD on homepage lacks `SearchAction`; no `Organization` schema site-wide
- **Evidence:** Homepage's only JSON-LD block is `{"@context":"https://schema.org","@type":"WebSite","name":"Airlines Locations","url":"https://airlineslocations.com/"}` — minimal, no `potentialAction`/`SearchAction` despite the homepage having a working site search form (`/airlines?q=`). No `Organization` schema was found on any inspected page.
- **Recommendation:** Not urgent pre-launch, but worth adding once content is real — improves eligibility for sitelinks search box and knowledge panel signals.

---

## Passed / Good

- **HTTPS + HSTS:** `strict-transport-security: max-age=63072000` present site-wide; `http://` requests redirect cleanly to `https://` (confirmed via `curl -L`); no mixed-content in the rendered page itself.
- **Security headers:** `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `content-security-policy: upgrade-insecure-requests`, `permissions-policy` (camera/mic/geolocation locked down), `referrer-policy: strict-origin-when-cross-origin` all present and consistent across static and SSR responses.
- **Viewport meta tag:** `<meta name="viewport" content="width=device-width, initial-scale=1">` present on every page inspected — base mobile-friendliness requirement met.
- **404 handling:** A nonexistent path (`/nonexistent-page-xyz123`) correctly returns HTTP 404, not a soft-404 (200).
- **www / apex consistency:** `www.airlineslocations.com` resolves cleanly to the apex `https://airlineslocations.com/` with no redirect loop or duplicate host.
- **Sitemap.xml validity:** Well-formed `urlset` XML, valid per `sitemap_discovery.py`, reachable at the standard `/sitemap.xml` path, no 404s among its 10 listed URLs.
- **URL hierarchy mirrors WP parent/child structure:** Spot-checked office pages (`/qatar-airways/qatar-airways-algiers-office-in-algeria`, `/turkish-airlines/turkish-airlines-miami-office-in-florida`) correctly nest under their airline parent slug, matching the README's stated WP-hierarchy-is-source-of-truth design.
- **No redirect chains observed:** All 10 sitemap URLs resolved in a single hop (0 redirects) at the canonical no-slash/lowercase form.
- **JavaScript rendering:** Homepage is plain server-rendered HTML with content already present (not an empty SPA shell) — `render_page.py` classified it `is_spa: false` and resolved it in `raw` mode without needing Playwright, consistent with the stated hybrid SSR/prerender architecture. Good for crawlability generally (no JS-rendering dependency for indexing).

---

## Not Yet Verified (flagged for follow-up, not exhaustively checked this pass)

- Individual head/meta/schema inspection of `/qatar-airways/qatar-airways-paris-office-in-france`, `/turkish-airlines`, `/turkish-airlines/turkish-airlines-leipzig-office-in-germany`, `/turkish-airlines/turkish-airlines-nouakchott-office-in-mauritania`, `/turkish-airlines/turkish-airlines-nuremberg-office-in-germany` — all confirmed 200 OK only; assume they inherit Critical #3, High #4/#5/#6 until spot-checked individually.
- hreflang — none found on any inspected page; site currently appears single-locale (en-US per `inLanguage` in schema), so likely not applicable, but not exhaustively confirmed across all 10 URLs.
- IndexNow protocol — no evidence of an IndexNow key file or ping integration found in the repo structure reviewed; not confirmed either way against Bing/Yandex/Naver endpoints.
- Full Core Web Vitals lab measurement (actual LCP/INP/CLS timing) — only source-level risk inspection was performed (items 10–11 above); no Lighthouse/CrUX run was performed in this pass.
- Mobile touch-target sizing and responsive breakpoint behavior — only static HTML/CSS class inspection was done; no rendered-viewport screenshot comparison performed.
