import type { APIRoute } from "astro";
import { isStaging } from "../lib/config";
import { getPageTree, isParentTemplate, isChildTemplate } from "../lib/wp";

// Dynamic, mirroring robots.txt.ts/sitemap.xml.ts: reflects the live WP page
// tree at request time (the same TTL-cached fetch every content page already
// pays for), so a newly published airline or office page shows up here on
// its own — nothing in this file needs editing by hand when content changes.
export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString().replace(/\/+$/, "") ?? "";

  // Same posture as robots.txt while pre-launch: don't hand any AI tool a
  // list of pages that are still Lorem-Ipsum placeholders, even though
  // llms.txt isn't a crawl directive the way robots.txt is and nothing
  // guarantees a fetcher honors the Disallow above it.
  if (isStaging) {
    return new Response(
      "# Airlines Locations\n\n> This site is in pre-launch preparation and is not yet publicly available.\n",
      { status: 200, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } },
    );
  }

  const tree = await getPageTree();
  const airlines = tree.list
    .filter((p) => isParentTemplate(p.template))
    .sort((a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title));

  const sections = airlines.map((airline) => {
    const offices = tree.list
      .filter((p) => p.parent === airline.id && isChildTemplate(p.template))
      .sort((a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title));

    const links =
      offices.length > 0
        ? offices.map((office) => `- [${office.title}](${base}/${office.fullPath})`).join("\n")
        : "- (no offices published yet)";

    return `## ${airline.title}\n${links}`;
  });

  const body = `# Airlines Locations

> A directory of airline office locations, contact details, and hours worldwide. Independent — no official affiliation with any airline, airport, or aviation authority.

${sections.join("\n\n")}
`;

  return new Response(body, {
    status: 200,
    // no-store for the same reason as sitemap.xml: a CDN caching this across
    // a page-tree update (or a STAGING flip) would keep serving a stale
    // listing regardless of the origin's own page-tree cache being purged.
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
};
