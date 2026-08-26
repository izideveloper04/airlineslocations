# Visual Analysis — airlineslocations.com (pre-launch audit)

**Date:** 2026-08-26
**Pages tested:** Homepage, Qatar Airways hub page, Qatar Airways Paris Office (location detail) page
**Viewports:** Desktop (1920x1080), Laptop (1366x768), Tablet (768x1024), Mobile (375x812) — full-page captures
**Screenshots:** `c:/airlineslocations.com/airlineslocations.com-audit/screenshots/{homepage,hub,location}/{desktop,laptop,tablet,mobile}.png`

---

## 🚨 Critical: Placeholder content is highly visible pre-launch

### Placeholder phone number "+1-XXX-XXX-XXXX"
This is **not buried anywhere** — it is one of the most visually prominent elements on the site, styled as a bold, high-contrast primary CTA button on every page tested:

- **Homepage (desktop + mobile, above the fold):** A white "Search Airlines" card sits in the hero banner with a full-width solid-blue button reading **"Call Now: +1-XXX-XXXX-XXX"** directly beneath the search field. On mobile this card is the first interactive element visible below the H1/subhead — impossible to miss.
- **Location detail page — Qatar Airways Paris Office (desktop + mobile, above the fold):** A dedicated white card in the top-right (desktop) / directly under the H1 (mobile) contains the heading **"Call Now"**, a large solid-blue pill button with a phone icon reading **"+1-XXX-XXX-XXXX"**, and the supporting line "Booking, Cancellation, Refund & Flight Change." On mobile this card renders full-width, immediately after the title — it is the dominant above-the-fold element, more prominent than the page's actual heading text.
- The placeholder format is inconsistent between pages too — homepage shows `+1-XXX-XXXX-XXX` while the location page shows `+1-XXX-XXX-XXXX` (extra digit grouping difference), compounding the "unfinished" impression.

**Verdict:** Extremely visually obvious. The blue call-to-action button design (meant to drive conversions) is exactly what draws the eye first on both hero sections, so the placeholder phone number is essentially guaranteed to be the first thing a visitor's eye lands on after the headline. This must be replaced before launch — as configured today, it actively invites clicks on a non-functional/fake number.

### Lorem Ipsum body copy
Confirmed on the Qatar Airways Paris Office page (and this is likely a templated pattern across all location pages, given the CMS-driven structure):
- The two body section headings are **literally the stock Lorem Ipsum generator headers**, verbatim: *"The standard Lorem Ipsum passage, used since 1966"* and *"Section 1.10.32 of 'de Finibus Bonorum et Malorum', written by Cicero in 45 BC."* These aren't disguised — they read as generator meta-text, not real headings a user would ever publish.
- 100% of the visible body content under both headings is unedited Lorem Ipsum paragraph text, filling the entire main content column on desktop and the full-width single column on mobile.
- On mobile, the placeholder phone CTA card is above the fold, and scrolling just slightly further reveals the Lorem Ipsum heading naming itself "Lorem Ipsum" — so within one scroll, a visitor sees two clear signals this page isn't real content.

**Verdict:** Maximally visible. This is not filler hidden in a footer or metadata — it is the entire primary content of the page, and the section headings self-identify as placeholder text. Any visitor or search engine crawler landing on this page (or others using the same template) would immediately recognize it as fake/incomplete.

**Recommendation:** Before launch, audit all location detail pages for this same Lorem Ipsum template pattern (this is very likely a default/fallback content block used when real office content hasn't been entered yet) and replace both the phone CTA and body copy sitewide, not just on the Paris page.

---

## Page-by-page findings

### 1. Homepage (`/`)
**Above the fold (desktop 1920x1080):**
- H1 "Everything You Need to Know, All in One Place" is clearly visible with supporting subhead over a full-width hero photo.
- Primary CTA is ambiguous: there's no single "primary" action — the hero offers a Search Airlines widget plus the placeholder Call Now button, competing for attention as two CTAs stacked in one card.
- Nav header is clean: logo, Airlines, Blog, and a small search input all fit on one line.

**Above the fold (mobile 375x812):**
- Hero heading, subhead, and the Search Airlines card (including the placeholder Call Now button) all fit within the first viewport — good compression, no critical content pushed below the fold.
- No hamburger menu is used; "Airlines" and "Blog" nav links sit inline next to the logo. At 375px width this still fits without wrapping, but leaves very little breathing room — worth re-checking at 320px (small older phones) since it's already tight at 375px.

**Other observations:**
- The "Latest Pages" grid (6 cards) mixes one real photo (Qatar Airways Algiers Office) with **five gray placeholder image icons** (broken/missing image state) for Paris, Miami, Leipzig, Nouakchott, and Nuremberg office cards. This is a second, very visible pre-launch content gap — the placeholder icon (a generic picture/mountain glyph) reads clearly as "no image uploaded yet" to any visitor scrolling the homepage.
- The blog section shows the default WordPress "Hello world!" post with the same placeholder image icon — another obvious pre-launch artifact.
- No overlapping elements, no layout shift issues observed, images that did load scaled correctly across viewports.

### 2. Airline hub page (`/qatar-airways`)
**Above the fold (desktop + mobile):**
- Clean breadcrumb (AirlinesLocations / Qatar Airways), large H1 "Qatar Airways", and subtext "2 pages listed under Qatar Airways" are all immediately visible with no scrolling.
- Two office cards render below: Algiers (real airport photo) and Paris (gray placeholder image icon, same broken-image pattern as the homepage grid).
- No CTA/phone placeholder appears on this listing-level page — it is comparatively "clean" of pre-launch artifacts other than the missing Paris thumbnail image.

**Mobile responsiveness:**
- Cards stack cleanly into a single column, full width, no overflow or squeezing.
- Footer content (Explore links, Disclaimer paragraph) reflows to a single column and remains fully readable at 16px+ body text.
- No horizontal scroll, no overlapping elements observed on this page at any viewport.

### 3. Location detail page (`/qatar-airways/qatar-airways-paris-office-in-france`)
Covered in detail above (placeholder phone + Lorem Ipsum). Additional notes:
- Breadcrumb wraps to two lines on mobile ("AirlinesLocations / Qatar Airways /" then title) — still legible, not a real issue.
- Sidebar "Latest Pages" module (linking to Algiers office) renders correctly on both desktop (right rail) and mobile (moved below body content, full width) — good responsive re-flow, no broken layout.
- Footer disclaimer block is present and legible on both viewports.
- The Call Now button and Search bar/nav appear to be reasonably sized touch targets on mobile (button spans near full card width, comfortably above the ~48px minimum height).
- No layout shift, overlap, or text-cutoff issues detected on this page at any viewport.

---

## Cross-page mobile responsiveness summary
- **No horizontal scrolling** detected on any of the three pages at 375px width.
- **Text is legible without zooming** — body copy renders at what appears to be 16px+ across all pages.
- **Navigation** uses a simple inline text-link pattern (no hamburger) at all viewports tested; functional at 375px but has little margin — recommend testing at 320px width and verifying tap target spacing between "Airlines" and "Blog" links.
- **Primary CTA buttons** (Search/Call Now on homepage, Call Now on location page) are full-width and touch-friendly on mobile.
- **Images that exist load and scale correctly**; the concerning pattern is the number of location cards site-wide still showing the generic placeholder icon instead of real photography — flagged above as a secondary pre-launch content gap beyond phone/Lorem Ipsum.
- **No overlapping elements or broken layout** observed on any page/viewport combination captured.

---

## Priority pre-launch fixes (visual)
1. **Replace placeholder phone number** `+1-XXX-XXX-XXXX` / `+1-XXX-XXXX-XXX` sitewide — it is styled as the primary conversion CTA on both the homepage and every location page and is currently the most eye-catching element on the page.
2. **Replace Lorem Ipsum body content** on the Qatar Airways Paris Office page and audit all other location pages for the same default template (headings literally reference "Lorem Ipsum" and "Cicero," making it unmistakable to any visitor).
3. **Upload real photos** for the ~5+ location cards currently showing generic gray placeholder image icons (visible in the homepage "Latest Pages" grid and the Qatar Airways hub page Paris card) and remove/replace the default "Hello world!" WordPress blog post.
4. Confirm mobile nav spacing at smaller widths (320px) given the tight fit already observed at 375px.
