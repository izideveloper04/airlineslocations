import type { APIRoute } from "astro";
import { isStaging } from "../lib/config";

// Dynamic so the Sitemap line always matches SITE_URL — no manual edit
// needed if the domain ever changes. WordPress lives on its own subdomain
// (cms.*), so there's no /wordpress path on this domain to disallow.
export const prerender = false;

export const GET: APIRoute = ({ site }) => {
  // no-store on both branches, for the same reason as sitemap.xml/
  // [...slug].astro: a CDN caching this across a STAGING flip would keep
  // serving "Disallow: /" (or vice versa) after a deliberate redeploy meant
  // to change it.
  if (isStaging) {
    return new Response("User-agent: *\nDisallow: /\n", {
      status: 200,
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  const base = site?.toString().replace(/\/+$/, "") ?? "";
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`, {
    status: 200,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
};
