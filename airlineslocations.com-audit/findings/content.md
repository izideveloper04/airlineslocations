# Content Quality Audit — airlineslocations.com (Pre-Launch)

Audited: 2026-08-26. Site is pre-launch; `robots.txt` blocks all crawlers and every
page carries `<meta name="robots" content="noindex, nofollow">`. Findings below are
pre-launch QA, not a "why aren't we ranking" diagnosis — but every issue here is a
launch blocker if left unresolved, because once the noindex tag / robots.txt gate is
lifted this content goes live as-is.

## Overall Content Quality Score: 8 / 100

This reflects a site where the location-page template pipeline is not content-complete.
Structure, schema, and navigation are in reasonably good shape; the actual page content
is placeholder/test data across effectively the entire indexable directory surface.

---

## 1. CRITICAL: Lorem Ipsum placeholder content — confirmed on ALL 6 location pages (not just Paris)

Verified by direct fetch of every location URL in the sitemap:

| URL | Body content | Phone | Address | Hours | FAQ schema |
|---|---|---|---|---|---|
| `/qatar-airways/qatar-airways-paris-office-in-france` | Lorem Ipsum (2 paragraphs, classic "since 1966" + Cicero passages) | `+1-XXX-XXX-XXXX` (dead `href="#"`) | None | None | None |
| `/qatar-airways/qatar-airways-algiers-office-in-algeria` | Identical Lorem Ipsum passages | `+1-XXX-XXX-XXXX` (dead `href="#"`) | None | None | **Yes — placeholder** (see §2) |
| `/turkish-airlines/turkish-airlines-miami-office-in-florida` | Same template, same placeholder pattern | `+1-XXX-XXX-XXXX` (dead `href="#"`) | None | None | None |
| `/turkish-airlines/turkish-airlines-leipzig-office-in-germany` | Same template, same placeholder pattern | `+1-XXX-XXX-XXXX` (dead `href="#"`) | None | None | None |
| `/turkish-airlines/turkish-airlines-nouakchott-office-in-mauritania` | Same template, same placeholder pattern | `+1-XXX-XXX-XXXX` (dead `href="#"`) | None | None | None |
| `/turkish-airlines/turkish-airlines-nuremberg-office-in-germany` | Same template, same placeholder pattern | `+1-XXX-XXX-XXXX` (dead `href="#"`) | None | None | None |

**Severity: Site-wide / systemic, not an isolated Paris-page bug.** Every single one of
the 6 published location pages — 100% of the "product" the directory exists to deliver —
uses the exact same Lorem Ipsum body copy ("The standard Lorem Ipsum passage, used since
1966" / "Section 1.10.32 of de Finibus Bonorum et Malorum, written by Cicero in 45 BC")
and the exact same literal placeholder phone string `+1-XXX-XXX-XXXX`, wired to a dead
`href="#"` link rather than a `tel:` link. This is the CMS/template default filler, never
replaced with real airline office data. This confirms the content pipeline (WordPress
headless CMS → Astro frontend) is producing pages, but the per-office data-entry step has
not happened for any published location.

Body word count per location page is ~230–260 words of actual prose (the two Lorem Ipsum
paragraphs plus headings) — far below the 500–600 word floor for location pages even before
accounting for the fact that none of it is real content. No physical address, no business
hours, no map embed, and the one differentiator between pages is the H1/title/breadcrumb
(city name only) — the body is not merely thin, it is non-existent as usable content.

The homepage hero also carries a second, differently-formatted placeholder phone number —
`+1-XXX-XXXX-XXX` (note the digit grouping differs from the location-page placeholder,
`+1-XXX-XXX-XXXX`) — also on a dead `href="#"` link ("Call Now"). The homepage "Learn About
Us" button is likewise `href="#"`.

## 2. Spammy/fake structured data: FAQPage schema with literal "question 1"/"answer 1" placeholders

The Algiers page (`/qatar-airways/qatar-airways-algiers-office-in-algeria`) publishes a
`FAQPage` JSON-LD block (`@type: ["WebPage","FAQPage"]`) with three `Question`/`Answer`
pairs whose actual text is:

- `"name": "question 1"`, `"acceptedAnswer": {"text": "answer 1"}`
- `"name": "question 2"`, `"acceptedAnswer": {"text": "answer 2"}`
- `"name": "question 3"`, `"acceptedAnswer": {"text": "answer 3"}`

This is rendered both in visible HTML (a `schema-faq` block) and in the JSON-LD graph, so
it isn't hidden/cloaked — it's genuinely fake FAQ content marked up as real. This is a
serious risk beyond ordinary thin content: **Google's guidelines explicitly prohibit
structured data that doesn't reflect real page content**, and FAQ rich-result markup with
non-representative or fabricated Q&A content is one of the more actively policed spam
structured-data patterns (historically enforced via manual actions revoking rich-result
eligibility site-wide, and it is a citable example under Google's "scaled content abuse" /
site reputation abuse framing when combined with placeholder contact data published across
many near-duplicate location pages). The Paris and all four Turkish Airlines pages do not
currently carry FAQPage schema — this pattern is present on 1 of 6 location pages, but the
Yoast FAQ block is clearly a template component that could get filled in with more
placeholder text as remaining office pages are built, so it should be flagged and fixed at
the template/workflow level before it propagates further.

## 3. WordPress default "Hello world!" post is live in production, including on the homepage

Confirmed. `/blog/hello-world` is the untouched WordPress scaffold post:
- H1: "Hello world!"
- Body: "Welcome to WordPress. This is your first post. Edit or delete it, then start writing!"
- `wordCount: 17` (per its own Article JSON-LD)
- Author displayed as a raw email address: `gradyrpollock@gmail.com` (this is very likely a
  real person's personal Gmail address, exposed as the public-facing byline — a privacy/PII
  leak, not just an authorship-polish issue)
- Author schema `sameAs` links to `http://cms.airlineslocations.com` — this discloses the
  headless WordPress admin/CMS origin URL in public structured data, an unnecessary
  attack-surface disclosure
- `/blog` listing page shows "1 post published" — this is the only blog post on the site,
  and it's the placeholder

This post is not orphaned: it is surfaced in a "Latest Blog Posts" section on the homepage
itself (`/`), directly under an "About Us" section, styled identically to how real articles
would appear (image placeholder, date, excerpt, "Read Article →" CTA). Anyone visiting the
homepage today sees WordPress's default scaffold content presented as the site's editorial
content. `/blog` and `/blog/hello-world` both correctly carry `noindex, nofollow`, consistent
with every other page site-wide — so this is not an indexation risk before launch, but it
is a visible-to-any-visitor QA gap and must not ship.

## 4. Site-wide indexation gate (context, not a defect)

Every page fetched (`/`, `/home`, `/qatar-airways`, `/turkish-airlines`, all 6 location
pages, `/blog`, `/blog/hello-world`) carries `<meta name="robots" content="noindex, nofollow">`
in addition to the sitewide `robots.txt` disallow. This is a correctly-functioning
pre-launch content gate — flagging only so it's tracked as something that must be
deliberately removed as part of go-live, not forgotten as "just how the site is."

## 5. Imagery: 5 of 6 location pages have no real image

The homepage "Latest Pages" grid and each location page itself render a generic SVG
image-placeholder icon for every location except Algiers, which has one real (but generic,
non-office-specific) stock photo of airport arrivals/departures signage
(`arr-dep.webp`) reused as both the page's hero/OG image and the homepage card thumbnail.
No page has an image that is actually specific to the airline office, city, or building
being described.

---

## E-E-A-T Assessment

Scored against `extracted_text`/rendered content of the location pages, which are the
site's core content type (the directory listings the site exists to provide).

| Factor | Weight | Score | Notes |
|---|---|---|---|
| Experience | 20% | 0/100 | Zero first-hand signals. No photos of actual offices, no visit notes, no original detail of any kind — content is unmodified Lorem Ipsum with no relationship to the named airline office or city. |
| Expertise | 25% | 0/100 | No author byline on location pages, no credentials, and the one identifiable "author" surfaced sitewide is an unedited WordPress default post attributed to a raw personal email address. No technical accuracy to assess because there are no facts on the page — Lorem Ipsum contains no claims about Qatar Airways, Turkish Airlines, or any office. |
| Authoritativeness | 25% | 5/100 | Domain and template structure (breadcrumbs, canonical tags, consistent nav) show organizational intent, but there is no external recognition, no citations, and the disclaimer text explicitly states "no official affiliation with any airline" — appropriate honesty, but it underscores the site has no inherent authority on office locations and must earn trust entirely through accurate, sourced data it does not yet have. |
| Trustworthiness | 30% | 3/100 | This is the most damaged factor and it's the highest-weighted one. Phone numbers are literal unusable placeholders (`+1-XXX-XXX-XXXX`) on dead links; no address or hours for any office; a FAQ block presents fabricated placeholder Q&A as if real, marked up in schema for search/AI systems to ingest as fact. Publishing fake contact information for real airlines at any scale is a direct trust violation — a user who called the displayed number or trusted the FAQ would get nothing, and a company (Qatar Airways/Turkish Airlines) whose name is attached to fabricated contact details did not consent to that. |

**Weighted E-E-A-T score: ~2/100** for the location-page template as currently populated.
(Homepage/hub pages score somewhat better structurally but inherit the same trust deficit
via the placeholder phone number and the live WordPress scaffold post.)

## AI Citation Readiness: 5 / 100

- Structural hierarchy (H1/H2/H3, breadcrumbs, JSON-LD `WebPage`/`BreadcrumbList`) is present
  and reasonably clean — this is the one area close to ready.
- No quotable, extractable facts exist anywhere in the location-page body (no address, phone,
  hours, terminal/airport info, services offered) — there is nothing an AI answer engine could
  cite even if it wanted to, other than the fabricated FAQ answers on the Algiers page, which
  would actively misinform if surfaced (`answer 1`, `answer 2`, `answer 3` are literally
  meaningless strings).
- FAQPage schema on Algiers is a liability, not an asset, for AI citation: a crawler or LLM
  ingesting that JSON-LD would either extract meaningless placeholder text or (worse) the page
  could later be "fixed" by someone quickly pasting in guessed/unsourced contact info to make
  the FAQ non-empty, which would then get surfaced by AI Overviews/assistants as if verified —
  a scaled-misinformation risk specific to this "aggregated at scale" business model.

## Programmatic / Scaled Content Risk (per Google's site reputation abuse & scaled content
abuse guidance)

This site is explicitly a programmatic directory (city × airline office pages generated
from a template). That model is not inherently against guidelines, but Google's scaled
content abuse policy specifically targets "creating many pages... with little to no value
add for users" and content that provides no benefit over what a search/AI answer already
gives. Publishing 6 near-identical template pages where the only unique element is the H1/
city name, and the "unique" body content is literally the same Lorem Ipsum block copy-pasted
across all of them, is close to a textbook example of what that policy is written to catch —
independent of the placeholder-phone-number trust problem. If this pattern is replicated
across the hundreds/thousands of airline-office pages implied by a "worldwide directory"
without adding real per-location data (verified phone, address, hours, sourced from the
airline or a maps/places API), the site is at meaningful risk of a site-wide scaled-content
demotion once indexed — regardless of the trust/placeholder-data issue, which is a separate
and more urgent problem for launch.

---

## Recommendations (priority order)

1. **Do not lift `noindex`/`robots.txt` gating until every published location page has
   real, verified contact data.** This is the single most important pre-launch gate.
2. **Fix the content pipeline, not just these 6 pages.** The fact that Paris, Algiers, and
   all 4 Turkish Airlines pages independently show the identical Lorem Ipsum + identical
   placeholder phone string confirms this is a template/CMS default, not per-page human
   error — audit the CMS content-entry workflow so newly published pages can't go live
   without required fields (phone, address, hours) populated.
2b. Change the phone placeholder from a dead `href="#"` to either omit the CTA entirely
    until real data exists, or block publish via a required-field CMS validation rule.
3. **Remove or complete the FAQPage schema.** Either populate Algiers's 3 Q&A pairs with
   real content or strip the `FAQPage` schema and visible FAQ block entirely — do not ship
   placeholder Q&A marked up as structured data.
4. **Replace or delete the WordPress "Hello world!" post** and remove it from the homepage
   "Latest Blog Posts" section before launch; audit whether `gradyrpollock@gmail.com` should
   be scrubbed from public author schema/Gravatar linkage sitewide.
5. **Add real, location-specific images** for all 6 pages (currently 5 of 6 show a generic
   SVG placeholder icon; the 6th uses an unrelated generic stock photo).
6. **Add first-hand/expertise signals once real data exists**: sourcing/verification notes
   (e.g., "phone verified via airline's official site, updated [date]"), a real author or
   editorial-team byline with a stated verification process, and physical address + hours
   sourced from an authoritative source (airline's own contact page, Google Business Profile,
   etc.) rather than left blank.
7. Re-audit this same checklist against every future location page before publish, given the
   confirmed systemic (not isolated) nature of this issue.
