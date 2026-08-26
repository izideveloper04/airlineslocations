# Schema.org Audit — airlineslocations.com

Audited: 2026-08-26 | Pre-launch (robots.txt blocks all crawlers; audited directly per site owner)

Pages checked: `/`, `/home`, `/qatar-airways`, `/qatar-airways/qatar-airways-algiers-office-in-algeria`,
`/qatar-airways/qatar-airways-paris-office-in-france`, `/turkish-airlines`,
`/turkish-airlines/turkish-airlines-miami-office-in-florida`,
`/turkish-airlines/turkish-airlines-leipzig-office-in-germany`,
`/turkish-airlines/turkish-airlines-nouakchott-office-in-mauritania`,
`/turkish-airlines/turkish-airlines-nuremberg-office-in-germany`

Format: 100% JSON-LD, `@context: https://schema.org` throughout. No Microdata/RDFa found (verified on the
raw Miami-office HTML: 0 `itemscope`/`itemtype`/`vocab=` occurrences).

## 1. Detection Results

| Page | JSON-LD blocks | Types present |
|---|---|---|
| `/` (homepage) | 1 block, 118 bytes | `WebSite` only (no `@id`, no `SearchAction`) |
| `/home` | 2 blocks | `WebPage`, `WebSite`, `BreadcrumbList` (x2, duplicated) |
| `/qatar-airways` (hub) | 2 blocks | `WebPage`, `WebSite`, `BreadcrumbList` (x2, duplicated) |
| `/qatar-airways/.../algiers-office-in-algeria` | 2 blocks, 4272 bytes | `WebPage`, `WebSite`, `BreadcrumbList` (x2), **`FAQPage`/`Question`/`Answer`**, `ImageObject` |
| `/qatar-airways/.../paris-office-in-france` | 2 blocks, 1965 bytes | `WebPage`, `WebSite`, `BreadcrumbList` (x2) |
| `/turkish-airlines` (hub) | 2 blocks | `WebPage`, `WebSite`, `BreadcrumbList` (x2, duplicated) |
| `/turkish-airlines/.../miami-office-in-florida` | 2 blocks | `WebPage`, `WebSite`, `BreadcrumbList` (x2) |
| `/turkish-airlines/.../leipzig-office-in-germany` | 2 blocks | `WebPage`, `WebSite`, `BreadcrumbList` (x2) |
| `/turkish-airlines/.../nouakchott-office-in-mauritania` | 2 blocks | `WebPage`, `WebSite`, `BreadcrumbList` (x2) |
| `/turkish-airlines/.../nuremberg-office-in-germany` | 2 blocks | `WebPage`, `WebSite`, `BreadcrumbList` (x2) |

**Correction to the initial scan**: the Qatar Airways Paris office page is *not* schema-empty — it now emits
the same WordPress-sourced `WebPage`/`WebSite`/`BreadcrumbList` graph as every other content page (1,965
bytes across 2 blocks). The only page still emitting the bare 118-byte `WebSite`-only stub is the actual
homepage at `/`.

**Never present anywhere in the crawl**: `LocalBusiness`, `Organization` (as an entity — only the `WebSite`
node exists), `TravelAgency`, `Airport`, `PostalAddress`, `GeoCoordinates`, `Product`/`Service`,
`AggregateRating`/`Review`. This confirms the stated gap: office pages carry no business/location entity
schema at all.

## 2. Architecture note (why every page but `/` has two schema sources)

- Block 1 (the `@graph` with `WebPage` + `BreadcrumbList` + `WebSite`, `#id`-anchored) is generated
  server-side by the headless WordPress backend (Yoast-style graph: `#website`, `#breadcrumb`,
  `#primaryimage` anchors, ISO 8601 `datePublished`/`dateModified`) and passed through into the Astro page.
- Block 2 (the standalone duplicate `BreadcrumbList`) is emitted by
  `src/components/Breadcrumbs.astro`, which independently builds and injects its own
  `application/ld+json` `BreadcrumbList` for every page using it (confirmed in source — it hardcodes
  `"AirlinesLocations"` as the root crumb label and derives `item` URLs via `new URL(item.href, Astro.site)`).
- `/` alone bypasses this pipeline and only emits a static 118-byte `WebSite` stub with no `@id`/`SearchAction`,
  so it's inconsistent with every other page on the site.

## 3. Validation Results

| # | Check | Result |
|---|---|---|
| 1 | `@context` = `https://schema.org` | ✅ Pass on all blocks |
| 2 | `@type` valid, not deprecated | ✅ Pass — no `HowTo`/`SpecialAnnouncement`/retired types found |
| 3 | Required properties present | ⚠️ Mixed — see issues below |
| 4 | Property values match expected types | ✅ Pass structurally |
| 5 | No placeholder text | ❌ **Fail** — see Issue C |
| 6 | URLs absolute | ✅ Pass |
| 7 | Dates ISO 8601 | ✅ Pass (`datePublished`/`dateModified` on WordPress-sourced graph) |

### Issue A — Duplicate, conflicting `BreadcrumbList` on every content page (Medium)
Every page except `/` emits **two** separate `BreadcrumbList` graphs that disagree with each other:

- Block 1 (WordPress): root crumb labeled `"Home"`, item URLs use trailing slashes
  (`https://airlineslocations.com/qatar-airways/`).
- Block 2 (Astro `Breadcrumbs.astro`): root crumb labeled `"AirlinesLocations"`, item URLs have no trailing
  slash (`https://airlineslocations.com/qatar-airways`).

Two `BreadcrumbList` objects with different item names/URLs for the same page is ambiguous for Google's
parser and risks an inconsistent breadcrumb trail being selected. **Fix**: emit only one. Recommend
keeping the Astro `Breadcrumbs.astro` version (it's the one under direct site-owner control and matches the
visible on-page breadcrumb `<nav>`) and suppressing/stripping the WordPress-sourced `BreadcrumbList` node
from the passed-through `@graph`, or vice versa — but not both.

### Issue B — `WebPage`/`BreadcrumbList` `@id`/`url` don't match the page's own canonical URL (Medium)
Confirmed on `/turkish-airlines/turkish-airlines-miami-office-in-florida`:
- `<link rel="canonical" href="https://airlineslocations.com/turkish-airlines/turkish-airlines-miami-office-in-florida">` (no trailing slash)
- JSON-LD `WebPage.@id` / `.url` = `https://airlineslocations.com/turkish-airlines/turkish-airlines-miami-office-in-florida/` (trailing slash)

This pattern repeats on every WordPress-sourced page checked. It's self-consistent within the WP graph but
doesn't match the canonical tag actually served by Astro. Low practical risk today, but worth normalizing
before launch so the self-referencing `@id` matches the canonical URL exactly.

### Issue C — `/home` duplicates `/` with a **self-identifying schema collision** (High)
`/home` renders essentially the same homepage content as `/` but is a distinct, live, 200-status URL. Its
`WebPage` node declares:
```
"@id": "https://airlineslocations.com/",
"url": "https://airlineslocations.com/"
```
i.e., the page served at `/home` claims via its own JSON-LD to *be* `https://airlineslocations.com/` — while
its `<link rel="canonical">` correctly says `https://airlineslocations.com/home`. This is a direct
self-reference conflict (canonical says one URL, embedded schema `@id`/`url` says another) and, combined with
duplicate homepage content living at two URLs, is a duplicate-content / entity-resolution risk once robots.txt
opens up at launch. **Fix before launch**: either 301 `/home` → `/`, or if `/home` must stay live, ensure its
WordPress-sourced schema graph uses its own URL (`https://airlineslocations.com/home`) consistently, matching
its canonical tag.

### Issue C.2 — Placeholder FAQ content live in production JSON-LD (High, fix before launch regardless of FAQPage's SERP status)
`/qatar-airways/qatar-airways-algiers-office-in-algeria` emits an `FAQPage` block with three `Question`/`Answer`
pairs whose content is literally `"question 1"` / `"answer 1"`, `"question 2"` / `"answer 2"`,
`"question 3"` / `"answer 3"` — unedited placeholder text shipped in structured data. Per validation rule #5
this fails regardless of whether FAQPage earns rich results.

**Priority note on FAQPage itself**: Google retired FAQ rich results for all sites (May 7, 2026), so this
markup's SERP value is nil going forward; any AI/GEO benefit is unconfirmed. Flag the *type choice* as
**Info priority only** — but flag the **placeholder text** as a launch blocker (Critical) independent of the
type's SERP status. Action: either populate real FAQ copy before launch (keep as `FAQPage` — no harm, no
guaranteed benefit) or remove the block entirely if no editorial owner will maintain real Q&A content. Since
this appears to be genuinely user-agnostic editorial FAQ copy (not user-submitted Q&A), `QAPage` is not the
right replacement type here.

## 4. Missing Schema Opportunities (the big one)

No page in the crawl carries any **entity** schema for the business/location itself — only `WebPage`/
`WebSite`/`BreadcrumbList` wrapper schema. Given the content model (airline office location pages, each
with a name, address, phone, and airline parent), this is the highest-value gap.

### 4a. Office location pages → `TravelAgency` (subtype of `LocalBusiness`)
Recommended over generic `LocalBusiness` because these are airline *ticket/service office* locations, not
retail storefronts — `TravelAgency` is a valid, more specific schema.org type that Google still parses as a
`LocalBusiness` for Knowledge Panel / local pack eligibility once NAP data is real. Do **not** generate this
from the current Lorem-Ipsum placeholder phone/address — wire the template below into the CMS field mapping
once real office data lands, so it activates automatically per-page.

```json
{
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": "https://airlineslocations.com/qatar-airways/qatar-airways-paris-office-in-france/#office",
  "name": "Qatar Airways Paris Office",
  "url": "https://airlineslocations.com/qatar-airways/qatar-airways-paris-office-in-france",
  "parentOrganization": {
    "@id": "https://airlineslocations.com/qatar-airways/#organization"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{REAL_STREET_ADDRESS}}",
    "addressLocality": "Paris",
    "addressRegion": "{{REGION_IF_APPLICABLE}}",
    "postalCode": "{{REAL_POSTAL_CODE}}",
    "addressCountry": "FR"
  },
  "telephone": "{{REAL_PHONE_E164}}",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "areaServed": "FR",
  "image": "https://airlineslocations.com/wp-content/uploads/{{REAL_OFFICE_OR_AIRLINE_IMAGE}}"
}
```
Required fields to wire up before enabling: `name`, `address` (all sub-fields), `telephone`. Optional but
recommended once known: `geo` (`GeoCoordinates`), `openingHoursSpecification`, `image`. **Do not publish this
block with the current Lorem-Ipsum phone/address placeholders** — ship it only once the CMS field is backed
by real data, and gate it in code (e.g., skip rendering the block if the address/phone field is empty or
matches a known placeholder string) so partially-migrated pages don't emit fake NAP data.

### 4b. Airline hub pages (`/qatar-airways`, `/turkish-airlines`) → `Organization` (airline)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://airlineslocations.com/qatar-airways/#organization",
  "name": "Qatar Airways",
  "url": "https://airlineslocations.com/qatar-airways",
  "logo": "https://airlineslocations.com/wp-content/uploads/{{REAL_AIRLINE_LOGO}}",
  "sameAs": [
    "https://www.qatarairways.com/"
  ]
}
```
`sameAs`/`logo` should point at real, verifiable assets (the airline's own official site/logo), not
placeholder images. Each office `TravelAgency` node should reference this via `parentOrganization` (as in
4a) to make the airline > office hierarchy machine-readable, matching the visible breadcrumb hierarchy.

### 4c. `BreadcrumbList` — already present but needs de-duplication (see Issue A)
Once de-duplicated, keep the `Breadcrumbs.astro`-generated version site-wide (root label
`"AirlinesLocations"`, consistent with the visible nav) as the single source of truth:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "AirlinesLocations", "item": "https://airlineslocations.com/" },
    { "@type": "ListItem", "position": 2, "name": "Qatar Airways", "item": "https://airlineslocations.com/qatar-airways" },
    { "@type": "ListItem", "position": 3, "name": "Qatar Airways Paris Office in France" }
  ]
}
```

### 4d. Homepage `/` → upgrade the 118-byte stub
Bring `/` in line with every other page (self `@id`, `SearchAction`, `BreadcrumbList` — de-duplicated per
Issue A) rather than leaving it as the one outlier with a bare `WebSite` block and no `@id`:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://airlineslocations.com/#website",
  "name": "Airlines Locations",
  "url": "https://airlineslocations.com/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://airlineslocations.com/airlines?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

## 5. Priority Summary

| Priority | Item |
|---|---|
| Critical | Placeholder `"question 1"/"answer 1"` FAQPage content live in production on the Algiers office page — fix or remove before launch |
| High | `/home` vs `/` duplicate homepage with conflicting self-referencing `@id`/`url` in schema — resolve before robots.txt opens |
| Medium | Duplicate/conflicting `BreadcrumbList` (WordPress graph vs. `Breadcrumbs.astro`) on every non-home page — de-duplicate to one source |
| Medium | `WebPage`/`BreadcrumbList` `@id` trailing-slash mismatch vs. canonical URL — normalize |
| High (opportunity) | No `TravelAgency`/`LocalBusiness` entity schema on any office page — wire up template in 4a once real NAP data lands |
| Medium (opportunity) | No `Organization` schema for airline hub pages — add template in 4b |
| Info | Existing `FAQPage` type itself — no Google SERP benefit post May-2026 retirement; keep only if content is real and an editorial owner maintains it |

## Files reviewed
- `C:\airlineslocations.com\src\components\Breadcrumbs.astro` — source of the duplicate `BreadcrumbList` block
- `C:\airlineslocations.com\src\layouts\{BaseLayout,ParentPageLayout,ChildPageLayout,DefaultPageLayout}.astro` — page templates (not yet inspected in detail for where the WordPress `@graph` is injected — recommend as next step when wiring in 4a/4b)
