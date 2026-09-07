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

  // A bare "User-agent: * / Allow: /" already permits every crawler on its
  // own (no Disallow anywhere overrides it) — these named blocks add
  // nothing a generic crawler doesn't already get, but per-agent rules take
  // priority over the wildcard for the agent they name, so listing the
  // major AI crawlers explicitly makes "every bot, including AI search and
  // AI Overviews sources, is allowed" an explicit statement in the file
  // instead of an inference from silence. Covers both AI-search fetchers
  // (cite this site in answers) and AI-training crawlers (GPTBot, CCBot,
  // anthropic-ai) — full-allow for both is the deliberate choice here, not
  // a narrower "search yes, training no" split.
  const AI_USER_AGENTS = [
    "GPTBot", // OpenAI training crawler
    "OAI-SearchBot", // ChatGPT web search
    "ChatGPT-User", // ChatGPT browsing/plugins
    "ClaudeBot", // Anthropic training crawler
    "Claude-Web", // Anthropic web search
    "anthropic-ai", // Anthropic (legacy agent string)
    "PerplexityBot", // Perplexity search/answers
    "Google-Extended", // Gemini / AI Overviews training opt-in
    "Bingbot", // Bing search + Copilot
    "CCBot", // Common Crawl (feeds many third-party LLM datasets)
  ];

  const body = [
    ...AI_USER_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, "Allow: /", ""]),
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
  });
};
