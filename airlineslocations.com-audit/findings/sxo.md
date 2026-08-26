# SXO (Search Experience Optimization) Analysis — airlineslocations.com

**Scope:** Pre-launch UX/structure QA (not a live-ranking diagnosis — `robots.txt` currently
sends `User-agent: * / Disallow: /` and every page carries `<meta name="robots"
content="noindex, nofollow">`, a deliberate pre-launch gate). This analysis evaluates the
page **template/structure** against what Google rewards for this query type. It deliberately
does not judge the Lorem Ipsum placeholder copy or the fake `+1-XXX-XXX-XXXX` number as a
content-quality issue — that is covered by a separate content-audit agent. Where a field is
simply *missing from the template* (no address field, no map slot, no hours field, no FAQ
block), that is scored here as a structural gap regardless of what copy would eventually fill it.

**Representative page audited:** `https://airlineslocations.com/qatar-airways/qatar-airways-paris-office-in-france`
**Representative queries:** "Qatar Airways Paris office", "Turkish Airlines Miami office address phone"

---

## Headline Finding: CRITICAL Page-Type Mismatch

The SERP for "\[Airline] \[City] office" queries is **not** dominated by official airline.com
pages or Google Business Profile / map-pack listings in the organic results we could observe.
It is dominated by a specific, recurring **programmatic "Airline Office Directory" template**
— a Local Page × Service Page × informational-FAQ hybrid — produced by sites like
airlinesheadoffices.com, flyoffices.com, airwaysoffices.com, globalairlinesoffices.com,
airlinesofficedesk.com, airlineshq.com, findairlineoffices.com, and airlinesofficespot.com.
This is exactly the niche airlineslocations.com is entering, and the target page currently
implements only the *shell* of that template — most of the fields that make the template work
are structurally absent, not just unfilled.

**Target page classification (taxonomy):** attempted **Local Page**, but populated with **0 of
5** required Local Page elements (NAP, geo, hours, embedded map, LocalBusiness schema).
**SERP dominant type:** **Local Page / Service Page hybrid** with informational depth (airport
details, HQ info, FAQ), confidence ~90%+ (9 of the top 10 organic results reviewed fit this
template; no official airline.com or GBP card appeared in the organic result set we could
inspect via search).

**Mismatch severity: CRITICAL** — comparable to the taxonomy's "Blog Post targeting
`[service] in [city]`" pattern: the page's actual body content (Lorem Ipsum) contains zero
location-specific information, so even setting aside copy quality, the *template* has no
component slots for the fields searchers and Google both expect for this query type.

---

## SERP Analysis

### Query 1: "Qatar Airways Paris office address phone"

Top organic results (page-type classified per taxonomy):

| # | Domain | Page Type | Notable structural signals |
|---|--------|-----------|----------------------------|
| 1 | airlinesheadoffices.com | Local × Service hybrid | "At a Glance" box with real-format Address / Phone / Working Hours; `tel:` click-to-call buttons (both header widget and sticky mobile button); 5 H2 sections (Office at a Glance, Airport Office, Head Office, Fleet, Services); hero photo of Paris; Organization + WebSite + BreadcrumbList schema; `index, follow`; meta description filled; **907 words** |
| 2 | aerocontact.com | Aggregator / directory listing | Multi-location index page |
| 3 | globalairlinesoffices.com | Local × Service hybrid (same template family) | (fetch blocked in this session — see Limitations) |
| 4 | airlineshq.com | Local × Service hybrid | Ticket-office directory format |
| 5 | airofficecounters.com | (bot-challenge page returned, could not classify) | — |
| 6 | airwaysoffices.com | Local Page (media-first) | "Paris Office Photos" gallery, Top Pages / Latest Pages / Latest Posts modules, Organization schema, `index, follow`, 423 words |
| 7 | airlineofficeworld.com | Local × Service hybrid | Same template family |
| 8 | flyoffices.com | **Local × Service × FAQ hybrid (strongest template observed)** | H2s: *Contact Information, Paris Airport Details, Services Available, Map of Qatar Airways Paris Office, Qatar Airways Headquarters, FAQs, Top Airlines, Top Pages*; **FAQPage schema present**; `index, follow`; **937 words** |
| 9 | airlinesofficedesk.com | Local × Service hybrid | Same template family |
| 10 | airlinesofficespot.com | Local × Service hybrid | Same template family |

Google's AI-synthesized answer for this query pulled address (19 rue de Ponthieu, 75008 Paris)
and hours (Mon–Fri 9–5) directly from this directory-site corpus — **not** from an official
Qatar Airways source, confirming these structured "at a glance" fields are what Google's
synthesis layer keys on for this query type.

### Query 2: "Turkish Airlines Miami office address phone"

Same competitor set repeats for a second airline/city pair (findairlineoffices.com,
allairwaysoffices.com, airlineshq.com, airwaysoffices.com, airlinesofficeexpert.com,
flyoffices.com, airlinesofficedesk.com, flightofficeworld.com, flightsoffices.com,
airlinesofficespot.com) — confirming this is a stable, repeatable SERP pattern across
airline/city pairs, not a one-off for Qatar Airways/Paris. Google's AI answer again resolved a
concrete address (201 South Biscayne Blvd, Suite 2650, Miami FL) and phone from this same
directory-site corpus.

### SERP features observed

- No visible shopping/product carousel (not commercial-transactional).
- No dominant featured snippet captured in this search session; Google's AI Overview /
  synthesized answer functions as the de facto snippet, sourced from directory sites.
- Low ad density in what we could observe — this is a low-competition, low-CPC informational/
  local query, not a booking-intent query.
- **Limitation:** WebSearch results in this session did not expose a distinguishable local
  pack / map-pack block or a PAA list separately from organic results, so local-pack presence
  and exact PAA question set could not be directly confirmed — see Limitations.

---

## Target Page: Structural Audit

`https://airlineslocations.com/qatar-airways/qatar-airways-paris-office-in-france`

- Title: "Qatar Airways Paris Office in France - airlineslocations.com" — good, matches intent.
- H1: "Qatar Airways Paris Office in France" — good, matches intent.
- Meta description: **null** (competitors all have a filled, keyword-rich meta description).
- `meta robots`: `noindex, nofollow` (expected pre-launch gate).
- H2s: *Call Now, Latest Pages, Explore, Disclaimer* — compare to flyoffices.com's *Contact
  Information, Airport Details, Services Available, Map, Headquarters, FAQs*.
- H3s (body content): both are literally the stock "Lorem Ipsum" and "Cicero 45 BC" filler
  headings — no Paris- or Qatar-Airways-specific heading exists anywhere on the page.
- **"Call Now" card**: present above the fold (structurally the right instinct — matches the
  click-to-call convention every competitor uses) but the phone link is `href="#"` — not even a
  `tel:` protocol link, so even once a real number is added, the link itself needs fixing to be
  clickable-to-dial on mobile.
- **No address field, no embedded/linked map, no working-hours field, no geo-coordinates** —
  the template provides no component slot for any of these, whereas every functioning
  competitor page has at minimum an address + hours pairing, and the top-structured competitor
  (flyoffices.com) has a dedicated "Map of ..." section.
- **No FAQ section / no FAQPage schema** — flyoffices.com (the deepest competitor template)
  uses this and it directly targets the PAA-style questions Google surfaces for this query type.
- **No HQ/head-office section** — competitors commonly pair the local-office info with a short
  "Qatar Airways Head Office" block (Doha address + email) for searchers who land on the wrong
  page tier.
- Related-page module ("Latest Pages" sidebar) surfaces exactly **one** link —
  "Qatar Airways Algiers Office in Algeria" — which is geographically irrelevant to a Paris
  searcher. Competitors use "Top Pages" / "Popular Pages" / "Related Offices" modules with
  multiple, more relevant links (nearby cities, other Qatar Airways pages, head office).
- Footer disclaimer references **"the Federal Airports Authority of Nigeria (FAAN)"** on a
  France office page — a hardcoded/reused disclaimer string that isn't localized per country,
  a templating bug independent of the Lorem Ipsum content issue (worth flagging to engineering
  even though it's copy-adjacent, because it stems from a missing dynamic field, not bad prose).
- Images: only 2 `<img>` tags on the page, and both are the site logo re-served at different
  sizes (header + footer). There is no city/office photo component and no map-image/iframe
  component in the template at all — competitors show a hero photo (Paris skyline) or an office
  photo gallery.
- Schema present: `WebPage`, `BreadcrumbList` (emitted **twice**, once via `@graph` and once as
  a separate inline block — minor duplication/hygiene issue), `WebSite` + `SearchAction`. Schema
  **missing**: `LocalBusiness`/`TravelAgency` (address/geo/hours), `Organization` (competitors
  all have this with a logo `ImageObject`), `FAQPage`.
- Word count: 252, all of it generic filler text (0 words are Paris- or Qatar-Airways-specific)
  vs. competitor range of 423–937 words of page-specific content.
- 0 external links (no link out to the official Qatar Airways site) — every competitor page
  reviewed had zero external links too, so this matches the SERP norm rather than being unique
  to the target, but it is a trust opportunity the whole niche is leaving on the table.

---

## User Stories (derived from SERP signals)

1. **As an urgent traveler with a booking/cancellation problem**, I want a phone number I can
   tap and dial immediately, because my flight issue is time-sensitive, but I'm blocked by a
   **dead link** (`href="#"`) where every competitor has a working `tel:` click-to-call button.
   *(Signal: universal `tel:` click-to-call convention across airlinesheadoffices.com,
   flyoffices.com sticky "Call Now" buttons.)*

2. **As a traveler who needs to visit the office in person**, I want the exact street address,
   hours, and a map, because I need to know if it's worth the trip and when they're open, but
   I'm blocked by an **information gap** — the template has no address, hours, or map fields at
   all. *(Signal: competitor "At a Glance" boxes with Address/Phone/Working Hours;
   flyoffices.com's dedicated "Map of Qatar Airways Paris Office" section.)*

3. **As a skeptical pre-trip researcher**, I want to confirm this is a legitimate, trustworthy
   source before I call an unfamiliar phone number, because this niche is known for third-party
   call-center numbers posing as airline contacts, but I'm blocked by a **trust gap** — no
   Organization/E-E-A-T schema, no external link to the official airline site, and a disclaimer
   that references the wrong country (Nigeria/FAAN on a France page). *(Signal: every ranking
   competitor lists a *different* phone number for the "same" office, indicating Google
   tolerates this niche's low-trust presentation only when basic NAP formatting and hours
   compensate for it.)*

4. **As a searcher comparing offices across nearby cities**, I want to quickly jump to a related
   or nearby office page, because I'm not sure I landed on the right city, but I'm blocked by a
   **weak related-content module** — the sidebar surfaces one geographically irrelevant link
   (Algiers, on a Paris page) instead of a real "nearby offices" or "all Qatar Airways offices"
   list. *(Signal: competitor "Top Pages"/"Popular Pages"/"Related Offices" modules.)*

5. **As a searcher who actually wants Qatar Airways corporate/media contact**, I want a short
   pointer to the head office, because I may have searched the wrong page tier, but I'm blocked
   by a **missing section** — no HQ block exists on the target template.
   *(Signal: airlinesheadoffices.com's "Know More About the Qatar Airways Head Office" H2 with
   Doha address + email.)*

Stories span decision stage (1, 2), consideration stage (3, 4), and awareness stage (5).

---

## SXO Gap Score: 24 / 100

(Labeled **SXO Gap Score** — distinct from any separate SEO Health Score. Scored against
template/structure, not placeholder-copy quality.)

| Dimension | Score | Evidence |
|---|---|---|
| Page Type | 2/15 | Attempted Local Page has 0 of 5 required elements (NAP, geo, hours, map, LocalBusiness schema) structurally present. |
| Content/Section Depth | 3/15 | Template provisions only 2 generic body blocks vs. competitors' 5–8 distinct content modules (Contact Info, Airport Details, Services, Map, HQ, FAQ, Fleet). |
| UX Signals | 5/15 | "Call Now" card is well-placed above the fold (credit) but the link is `href="#"` (dead), no map/hours/FAQ widgets exist, related-page module surfaces an irrelevant link. |
| Schema | 4/15 | Has WebPage/BreadcrumbList(×2 duplicated)/WebSite; missing LocalBusiness, Organization, FAQPage — all present on top competitors. |
| Media | 1/15 | Only the shared site logo appears (2×); no city-photo or map-embed component slot exists in the template at all. |
| Authority | 3/15 | No byline/verification-date UI, no Organization/E-E-A-T schema, no external link to official source, disclaimer hardcoded to the wrong country. |
| Freshness | 6/10 | `datePublished`/`dateModified` are correctly wired into schema (genuine structural strength); no user-visible "last verified" element and modification timestamp is only 1 second after publish, suggesting it's a build timestamp rather than a real content-freshness signal. |
| **Total** | **24/100** | |

---

## Persona Scores

Weakest first.

| Persona | Journey Stage | Relevance | Clarity | Trust | Action | Total | Rating |
|---|---|---|---|---|---|---|---|
| In-Person Visitor (needs address/hours/map) | Decision | 3/25 | 2/25 | 3/25 | 2/25 | **10/100** | Critical Mismatch |
| HQ/Corporate Seeker | Awareness | 4/25 | 2/25 | 4/25 | 3/25 | **13/100** | Critical Mismatch |
| Skeptical Pre-Trip Researcher | Consideration | 14/25 | 6/25 | 3/25 | 5/25 | **28/100** | Critical Mismatch |
| Urgent Traveler (booking/cancellation) | Decision | 10/25 | 15/25 | 3/25 | 4/25 | **32/100** | Critical Mismatch |
| Comparison Shopper (nearby cities) | Consideration | 10/25 | 8/25 | 10/25 | 6/25 | **34/100** | Critical Mismatch |

### Weakest Persona: In-Person Visitor (10/100)
**Top issue:** No address, hours, or map field exists anywhere in the template.
**Recommended fix:** Add a structured "Office Details" block directly under the H1/Call-Now
card with labeled fields — *Address*, *Working Hours*, *Nearest Airport/Landmark* — plus an
embedded or linked map. Back it with `LocalBusiness` (or `TravelAgency`) schema including
`address`, `geo`, and `openingHoursSpecification`.

### Systemic Issue
- **Missing structural fields, not just missing copy:** address, hours, map, FAQ, and HQ are
  absent as *components*, not just unfilled text. Every persona's lowest score is driven by a
  field the template simply doesn't render yet.
- **Dead CTA link:** the one interactive element the page does have (`Call Now`) points to
  `href="#"` — this should be a `tel:` link even with placeholder digits, so QA of the
  click-to-call mechanism itself doesn't need to wait on real content.

### Priority Actions (template/structure only)
1. Add an "Office Details" component (address, hours, map slot) — fixes the two lowest-scoring
   personas (In-Person Visitor, HQ Seeker) and closes the single biggest Page-Type gap.
2. Fix the "Call Now" link to use `tel:` protocol (even with placeholder number) and add a
   working-hours field so the CTA is genuinely testable pre-launch.
3. Add an FAQ component with `FAQPage` schema — matches the strongest competitor template
   (flyoffices.com) and targets Google's PAA-style synthesis for this query type.
4. Replace the single "Latest Pages" link with a real "Related/Nearby Offices" module (same
   airline, same region) and add a short "Head Office" pointer block.
5. Add `LocalBusiness`/`TravelAgency` and `Organization` schema; de-duplicate the two
   `BreadcrumbList` blocks; fix the country-mismatched disclaimer (Nigeria/FAAN string should be
   a dynamic/removed field, not hardcoded).
6. Add a location-relevant image slot (city photo or office photo) — currently the only two
   `<img>` tags on the page are the site logo.

---

## Cross-Skill Recommendations

- Missing `LocalBusiness`, `Organization`, and `FAQPage` schema → recommend `/seo schema` for
  generation once real NAP data is available.
- Thin/placeholder body content (252 words, no location-specific sections) → recommend
  `/seo content` and `/seo page` (this is explicitly being handled by a separate content-audit
  agent per the task scope, flagged here only as it relates to missing template sections).
- Local intent is the dominant SERP pattern for this query family → recommend `/seo local` once
  real office data exists, to evaluate Google Business Profile strategy alongside the on-page
  Local Page template.

---

## Limitations

- Robots.txt (`Disallow: /`) and per-page `noindex, nofollow` meant this analysis is
  structural/pre-launch QA only — no live ranking signals (actual position, live SERP feature
  eligibility, CTR) could be assessed for airlineslocations.com itself.
- WebSearch results in this session did not clearly expose a separate map-pack/local-pack block
  or a distinct PAA list — local-pack presence and the exact PAA question set for these queries
  could not be directly confirmed and were inferred from general knowledge of this query
  pattern plus the directory-site corpus that Google's AI-synthesized answer drew from.
- One competitor URL (globalairlinesoffices.com) failed to render in this session and one
  (airofficecounters.com) returned a bot-challenge/error page instead of real content; both were
  excluded from structural comparison rather than mis-classified.
- Only 2 representative city/airline pages were spot-checked in depth (Paris/Qatar Airways,
  Miami/Turkish Airlines address+phone via search-answer only); the full competitor structural
  audit (H2s/schema/word count) was performed on the Qatar Airways/Paris query set.
- Content-quality assessment of the Lorem Ipsum placeholder text itself is explicitly out of
  scope for this analysis, per task instructions — a separate agent covers content quality.
- No accessibility tree / screen-reader pass was performed on the target page.

---

## Structured Summary (for audit-data.json)

```json
{
  "category": "Search Experience",
  "sxo_gap_score": 24,
  "score_scale": 100,
  "page_type_mismatch": {
    "target_page": "https://airlineslocations.com/qatar-airways/qatar-airways-paris-office-in-france",
    "target_classification": "Local Page (attempted, structurally incomplete)",
    "serp_dominant_type": "Local Page x Service Page x FAQ hybrid (airline-office directory template)",
    "serp_confidence_pct": 90,
    "severity": "CRITICAL"
  },
  "missing_template_components": [
    "address field",
    "working hours field",
    "embedded/linked map",
    "geo coordinates",
    "FAQ section + FAQPage schema",
    "LocalBusiness/TravelAgency schema",
    "Organization schema",
    "HQ/head-office section",
    "location-relevant image/photo slot",
    "functional tel: link (currently href=\"#\")",
    "meaningful related/nearby-offices module"
  ],
  "persona_scores": [
    {"persona": "In-Person Visitor", "stage": "Decision", "total": 10, "rating": "Critical Mismatch"},
    {"persona": "HQ/Corporate Seeker", "stage": "Awareness", "total": 13, "rating": "Critical Mismatch"},
    {"persona": "Skeptical Pre-Trip Researcher", "stage": "Consideration", "total": 28, "rating": "Critical Mismatch"},
    {"persona": "Urgent Traveler", "stage": "Decision", "total": 32, "rating": "Critical Mismatch"},
    {"persona": "Comparison Shopper", "stage": "Consideration", "total": 34, "rating": "Critical Mismatch"}
  ],
  "pre_launch_context": {
    "robots_txt": "Disallow: / (site-wide, deliberate)",
    "meta_robots": "noindex, nofollow (per-page, deliberate)",
    "scope_note": "Findings assess template/structure only; placeholder copy quality is out of scope (covered separately)."
  }
}
```

Generate a PDF report? Use `/seo google report`.
