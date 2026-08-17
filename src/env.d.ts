/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Server-only config is read via process.env (not import.meta.env) so it's
// truly live on Hostinger — set in the Node.js App panel, no rebuild needed
// to pick up a changed value (see src/lib/wp.ts, src/lib/aviationstack.ts).
declare namespace NodeJS {
  interface ProcessEnv {
    STAGING?: string;
    SITE_URL?: string;
    WP_API_URL?: string;
    AVIATIONSTACK_API_KEY?: string;
    AVIATIONSTACK_CACHE_TTL?: string;
    PAGE_TREE_CACHE_TTL?: string;
    SITE_TITLE?: string;
  }
}
