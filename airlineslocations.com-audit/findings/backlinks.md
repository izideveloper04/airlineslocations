# Backlink Profile Audit — airlineslocations.com

**Date:** 2026-08-26
**Data tier:** 0 (Common Crawl + local verification crawler only)
**Moz API:** not configured (no `moz_api_key` / `MOZ_API_KEY`) — skipped
**Bing Webmaster API:** not configured (no `bing_api_key` / `BING_WEBMASTER_API_KEY`) — skipped
**DataForSEO:** not installed/enabled — skipped

## Summary

This is confirmed to be a brand-new, pre-launch site with **no backlink profile to speak of**. All available free (Tier 0) checks are consistent with the expected baseline: near-zero backlinks/referring domains, no crawl presence, and no history of prior ownership that could carry over toxic links. No unexpected findings surfaced.

**Backlink Health Score: INSUFFICIENT DATA** (not scored — see below)

## Findings

### 1. robots.txt confirms site is blocking all crawlers
- Source: Direct fetch of `https://airlineslocations.com/robots.txt` (Parsed, confidence: 0.95)
- HTTP 200, body:
  ```
  User-agent: *
  Disallow: /
  ```
- This blanket disallow explains why the site has no organic backlink discovery yet — search engines and most third-party crawlers are instructed not to index it.

### 2. Common Crawl: domain not present in the web graph
- Source: Common Crawl Web Graph, release `cc-main-2026-jan-feb-mar` (confidence: 0.50, domain-level, quarterly release — see https://commoncrawl.org/web-graphs)
- Result: `in_crawl: false`, `in_rankings: false`, PageRank: null, PageRank rank: null, Harmonic Centrality: null
- Note returned by tool: "Domain not found in Common Crawl data. It may be too new, too small, or not yet crawled."
- Interpretation: this is consistent with a pre-launch/robots-blocked domain — no inbound links have been discovered by CC's crawl, and the domain has no measurable link-based ranking signal yet. This is an absence-of-data result, not evidence of zero backlinks in an absolute sense (CC is a sample of the web, not exhaustive).

### 3. Domain registration history: freshly registered, not a dropped/reused domain
- Source: WHOIS (fallback lookup) via `domain_history.py` (confidence: 0.60)
- Created: 2026-08-14 (12 days ago)
- Updated: 2026-08-17
- Expires: 2027-08-14
- Registrar: NameCheap, Inc.
- Years registered: 0.03 (~12 days)
- This directly rules out the "dropped/reused domain with inherited spammy backlinks from a previous owner" scenario the audit was watching for. A domain registered less than two weeks ago cannot have a prior-owner link history — there is no "previous domain owner" to inherit risk from. `risk` field returned as `unknown` only because no baseline topic was available for shift detection, not because of any detected issue.

### 4. No known backlinks available to verify
- The `verify_backlinks.py` crawler-based verification step was **not run** because no list of known/claimed backlinks exists for this domain (none supplied, none discoverable via Common Crawl at this stage). There is nothing to verify yet.

### 5. Moz / Bing / DataForSEO — unavailable
- Moz API: no key configured. Skipped Tier 1 checks (DA/PA, spam score, referring domains, anchor text, top pages).
- Bing Webmaster API: no key configured. Skipped Tier 2 checks (inbound links, comparison).
- DataForSEO: not installed. Skipped Tier 3 checks (referring domain trend, toxic ratio, link velocity, geo relevance).

## Scoring

Per Tier-0 policy, fewer than 4 of the 7 weighted scoring factors (referring domain count, domain quality distribution, anchor text naturalness, toxic link ratio, link velocity, follow/nofollow ratio, geographic relevance) have any data source at this tier. Producing a numeric 0–100 Backlink Health Score would be misleading, so this audit reports:

**Backlink Health Score: INSUFFICIENT DATA**

| Factor | Data available? | Source |
|---|---|---|
| Referring domain count | No | — |
| Domain quality distribution | No | — |
| Anchor text naturalness | No | — |
| Toxic link ratio | No | — |
| Link velocity trend | No | — |
| Follow/nofollow ratio | No | — |
| Geographic relevance | No | — |

Only domain-level presence/absence signals (Common Crawl) and registration heritage (WHOIS) were available — neither maps cleanly to the weighted scoring factors above.

## Recommendations

**Priority: Low** (backlinks are not a launch blocker for a pre-launch site; expected to be re-checked post-launch)

1. **Low** — Re-run this backlink audit after the site removes `Disallow: /` from robots.txt and is submitted for indexing. Backlink data will remain effectively at zero until the site is crawlable and discoverable.
2. **Low** — Configure a free Moz API key (2,500 rows/month, https://moz.com/products/api) ahead of launch so Tier 1 metrics (DA/PA, spam score, referring domains, anchor text) are available immediately post-launch for a proper baseline.
3. **Low** — Once the site is live and registered in Bing Webmaster Tools, Tier 2 inbound-link data becomes available for the property.
4. **Informational** — No action needed on prior-owner/dropped-domain risk; domain was registered new (2026-08-14) via NameCheap, confirmed via WHOIS.
5. For content quality/E-E-A-T signals, run `/seo content <url>`. For crawlability/indexability issues (including the current robots.txt block), run `/seo technical <url>` — this is out of scope for the backlink analysis.

## Data Source Confidence Reference

- Common Crawl (domain-level): confidence 0.50, quarterly release (`cc-main-2026-jan-feb-mar`)
- WHOIS domain history (fallback source): confidence 0.60
- Direct robots.txt fetch (parsed): confidence 0.95
- Moz API: unavailable (would be 0.85)
- Bing Webmaster API: unavailable (would be 0.70)
- DataForSEO: unavailable (would be 1.00)

Report validated via `validate_backlink_report.py` — status: **PASS** (0 errors, 0 warnings).
