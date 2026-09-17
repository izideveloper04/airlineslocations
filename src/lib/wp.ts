import he from "he";
// All WordPress-fetching logic lives here. No ad-hoc fetch() calls to the
// WP REST API anywhere else in the project (components/pages import from
// this module only).

// process.env (not import.meta.env) so this is read live from the Node
// process's environment on Hostinger — changing WP_API_URL in the Node.js
// App panel + restarting the app is enough, no rebuild required.
// WordPress lives on its own subdomain (e.g. cms.airlineslocations.com),
// entirely separate from SITE_URL (the Node app's own domain) — no
// derivation between the two, since they're independent vhosts.
const WP_API_URL = (process.env.WP_API_URL ?? "http://localhost:8080/wp-json/wp/v2").replace(/\/+$/, "");

/** The WP origin (e.g. https://cms.airlineslocations.com) - just for rewriting
 *  the WP-origin URLs baked into Yoast's schema graph (see YoastHead.schema)
 *  to this site's own origin before it's injected into a page's <head>. */
export function getWpOrigin(): string {
  return new URL(WP_API_URL).origin;
}
const PAGE_TREE_CACHE_TTL_MS =
  Number(process.env.PAGE_TREE_CACHE_TTL ?? 300) * 1000;

export interface YoastHead {
  title?: string;
  description?: string;
  canonical?: string;
  og_title?: string;
  og_description?: string;
  og_image?: { url: string }[];
  /**
   * Yoast's full structured-data graph for this page/post - WebPage,
   * BreadcrumbList, ImageObject, and (when the content has a Yoast FAQ
   * block) FAQPage/Question/Answer nodes, among others. On a normal
   * (non-headless) WP install Yoast injects this into <head> itself via
   * wp_head; this REST field exists specifically so a headless frontend
   * like this one can do the same. Every @id/url in it points at the WP
   * origin (cms.*), not this site - resolvePageMeta leaves that alone,
   * BaseLayout rewrites it to the live site's origin right before injecting
   * the <script> tag (see getWpOrigin below).
   */
  schema?: { "@context": string; "@graph": Record<string, unknown>[] };
}

export interface WPPage {
  id: number;
  slug: string;
  parent: number;
  title: string;
  content: string;
  template: string;
  menuOrder: number;
  date: string;
  yoast: YoastHead | null;
  featuredImage: string | null;
  /** Computed by walking the parent chain, e.g. "flights/departures". */
  fullPath: string;
  /** WP's own per-page Discussion setting ("Allow comments") — the comment
   *  form is hidden entirely when this is false, independent of whether any
   *  approved comments already exist. */
  commentsOpen: boolean;
}

export interface SiteSettings {
  title: string;
}

export interface PageTree {
  byId: Map<number, WPPage>;
  byPath: Map<string, WPPage>;
  list: WPPage[];
}

interface RawWPPage {
  id: number;
  slug: string;
  parent: number;
  title: { rendered: string };
  content: { rendered: string };
  wp_template?: string;
  menu_order?: number;
  date: string;
  yoast_head_json?: YoastHead;
  comment_status?: "open" | "closed";
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
  };
}

/** A published blog post — unrelated to the page hierarchy (WPPage/PageTree). */
export interface WPPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  featuredImage: string | null;
  yoast: YoastHead | null;
}

interface RawWPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  yoast_head_json?: YoastHead;
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
  };
}

// A cache layer somewhere on the hosting network path between this app and
// WP_API_URL (not WordPress itself, not the public CDN edge — both confirmed
// to always serve fresh data) has been observed serving a stale response
// indefinitely, keyed by URL, regardless of this app's own TTL/purge cycle
// or WordPress's own Cache-Control headers. A per-request cache-busting
// param plus an explicit no-store request header defeats it structurally,
// without needing to know exactly what or where it is.
function withCacheBust(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_cb=${Date.now()}`;
}

const NO_CACHE_REQUEST_HEADERS = { "Cache-Control": "no-store, no-cache" };

function apiUrl(path: string) {
  return withCacheBust(`${WP_API_URL.replace(/\/+$/, "")}${path}`);
}

/** Slugs that are hand-built Astro routes and must never be shadowed by a WP page.
 *  "home" is WordPress's own default sample page slug on a fresh install -
 *  reserved so a leftover, never-deleted one can never leak into the page
 *  tree as a second, competing homepage at /home. */
const RESERVED_SLUGS = new Set(["", "api", "airlines", "blog", "home"]);

/** The fields buildPageTree() actually needs for catalog-wide listings
 *  (sitemap, homepage "latest pages", the airlines directory) — deliberately
 *  missing `content` and `yoast_head_json`. WP's REST controller only pays
 *  the cost of rendering content / computing Yoast's full schema graph when
 *  a request's `_fields` actually asks for them, so omitting them here cuts
 *  both payload size and per-page server cost across the whole catalog.
 *  Single-page rendering (getPageByPath) fetches those full fields
 *  separately, scoped to just the one page being rendered. */
interface RawWPPageLite {
  id: number;
  slug: string;
  parent: number;
  title: { rendered: string };
  wp_template?: string;
  menu_order?: number;
  date: string;
  _embedded?: {
    "wp:featuredmedia"?: { source_url: string }[];
  };
}

const PAGE_LIST_FIELDS = "id,slug,parent,title,wp_template,menu_order,date,_links,_embedded";

/** Bounded-concurrency map: runs at most `limit` calls to `fn` at once
 *  instead of firing all of them simultaneously (the WP host is itself
 *  resource-constrained) or one at a time (too slow across hundreds of
 *  pages). */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) || 1 }, worker));
  return results;
}

const CATALOG_FETCH_CONCURRENCY = 6;

async function fetchPagesPage(pageNumber: number, perPage: number): Promise<{ items: RawWPPageLite[]; totalPages: number }> {
  const res = await fetch(
    apiUrl(`/pages?per_page=${perPage}&page=${pageNumber}&_embed=wp:featuredmedia&_fields=${PAGE_LIST_FIELDS}`),
    { headers: NO_CACHE_REQUEST_HEADERS },
  );
  if (!res.ok) {
    throw new Error(`WP page catalog fetch failed: ${res.status} ${res.statusText}`);
  }
  return { items: await res.json(), totalPages: Number(res.headers.get("X-WP-TotalPages") ?? "1") };
}

/** Every published page, lightweight fields only — see RawWPPageLite. Used
 *  solely to build the catalog-wide tree (buildPageTree), never to resolve
 *  one page's URL (getPageByPath queries WP directly and narrowly for
 *  that). Paginates with bounded concurrency rather than one request at a
 *  time in a sequential loop: a single WP REST round trip here has been
 *  observed to take 1-2s on its own, and this catalog can run into the
 *  hundreds of pages. */
async function fetchAllPagesLite(): Promise<RawWPPageLite[]> {
  const perPage = 100;
  const first = await fetchPagesPage(1, perPage);
  const results = [...first.items];

  if (first.totalPages > 1) {
    const remainingPageNumbers = Array.from({ length: first.totalPages - 1 }, (_, i) => i + 2);
    const batches = await mapWithConcurrency(remainingPageNumbers, CATALOG_FETCH_CONCURRENCY, (p) => fetchPagesPage(p, perPage));
    for (const batch of batches) results.push(...batch.items);
  }

  return results;
}

async function fetchAllPosts(): Promise<RawWPPost[]> {
  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  const results: RawWPPost[] = [];

  do {
    const res = await fetch(
      apiUrl(`/posts?per_page=${perPage}&page=${page}&_embed=wp:featuredmedia&_fields=id,slug,title,excerpt,content,date,yoast_head_json,_links,_embedded`),
      { headers: NO_CACHE_REQUEST_HEADERS },
    );
    if (!res.ok) {
      throw new Error(`WP posts fetch failed: ${res.status} ${res.statusText}`);
    }
    totalPages = Number(res.headers.get("X-WP-TotalPages") ?? "1");
    results.push(...(await res.json()));
    page += 1;
  } while (page <= totalPages);

  return results;
}

function normalizePath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

function computeFullPath(id: number, byId: Map<number, RawWPPageLite>): string {
  const segments: string[] = [];
  let current: RawWPPageLite | undefined = byId.get(id);
  const seen = new Set<number>();

  while (current) {
    if (seen.has(current.id)) break; // guard against a corrupt/circular parent chain
    seen.add(current.id);
    segments.unshift(current.slug);
    current = current.parent ? byId.get(current.parent) : undefined;
  }

  return segments.join("/");
}

let cache: { tree: PageTree; expires: number } | null = null;
let inflight: Promise<PageTree> | null = null;
// Bumped by purgeCache() so a rebuild already in flight when a purge lands
// can't win the race and resurrect the stale tree into `cache` once it
// resolves — see the generation check in getPageTree() below.
let generation = 0;

const EMPTY_TREE: PageTree = { byId: new Map(), byPath: new Map(), list: [] };

async function buildPageTree(): Promise<PageTree> {
  const raw = await fetchAllPagesLite();
  const rawById = new Map(raw.map((p) => [p.id, p]));

  const byId = new Map<number, WPPage>();
  const byPath = new Map<string, WPPage>();
  const list: WPPage[] = [];

  for (const p of raw) {
    const fullPath = normalizePath(computeFullPath(p.id, rawById));
    if (RESERVED_SLUGS.has(fullPath)) continue;

    const page: WPPage = {
      id: p.id,
      slug: p.slug,
      parent: p.parent,
      title: he.decode(p.title.rendered),
      content: "", // not fetched for catalog-wide listings — see RawWPPageLite
      template: p.wp_template ?? "",
      menuOrder: p.menu_order ?? 0,
      date: p.date,
      yoast: null, // ditto
      featuredImage: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
      fullPath,
      commentsOpen: false, // ditto — no catalog-listing consumer reads this
    };

    byId.set(page.id, page);
    byPath.set(fullPath, page);
    list.push(page);
  }

  return { byId, byPath, list };
}

function startPageTreeRebuild(): void {
  if (inflight) return;

  const requestGeneration = generation;
  inflight = buildPageTree()
    .then((tree) => {
      // A purgeCache() call that landed while this fetch was in flight
      // bumped `generation` — committing this result now would silently
      // undo that purge and hold the stale tree for a full TTL window.
      if (requestGeneration === generation) {
        cache = { tree, expires: Date.now() + PAGE_TREE_CACHE_TTL_MS };
      }
      return tree;
    })
    .catch((err) => {
      console.error("[wp] page tree background rebuild failed:", err);
      throw err;
    })
    .finally(() => {
      inflight = null;
    });

  // The caller below never awaits this promise (that's the point — no
  // request blocks on a rebuild), so give it its own rejection handler or
  // a WP outage during a background refresh becomes an unhandled rejection.
  inflight.catch(() => {});
}

/**
 * Stale-while-revalidate, including at cold start: never blocks a request
 * on rebuilding the full catalog. A fresh cache is returned as-is; an
 * expired one is still returned as-is while a rebuild runs in the
 * background; with no cache at all yet (right after a server restart, or
 * immediately after purgeCache() if nothing had ever populated it) an empty
 * tree is returned while the first build runs.
 *
 * Only catalog-wide listings call this (sitemap.xml, the homepage's "latest
 * pages", the airlines directory via getPagesByTemplateSuffix) — they
 * degrade to a briefly-empty listing rather than hanging. Single-page
 * rendering (getPageByPath) never calls this at all, so it's unaffected
 * either way.
 */
export async function getPageTree(): Promise<PageTree> {
  if (cache) {
    if (cache.expires <= Date.now()) startPageTreeRebuild();
    return cache.tree;
  }

  startPageTreeRebuild();
  return EMPTY_TREE;
}

let postsCache: { posts: WPPost[]; expires: number } | null = null;
let postsInflight: Promise<WPPost[]> | null = null;

async function buildPosts(): Promise<WPPost[]> {
  const raw = await fetchAllPosts();
  return raw
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: he.decode(p.title.rendered),
      excerpt: p.excerpt.rendered,
      content: p.content.rendered,
      date: p.date,
      featuredImage: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
      yoast: p.yoast_head_json ?? null,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Published blog posts, newest first — separate from the page tree (posts
 * aren't part of the page hierarchy), but shares the same cache/TTL/purge
 * machinery, including the generation guard against a purge landing mid-fetch.
 */
export async function getPosts(): Promise<WPPost[]> {
  const now = Date.now();
  if (postsCache && postsCache.expires > now) return postsCache.posts;
  if (postsInflight) return postsInflight;

  const requestGeneration = generation;
  postsInflight = buildPosts()
    .then((posts) => {
      if (requestGeneration === generation) {
        postsCache = { posts, expires: Date.now() + PAGE_TREE_CACHE_TTL_MS };
      }
      return posts;
    })
    .finally(() => {
      postsInflight = null;
    });

  return postsInflight;
}

export async function getPostBySlug(slug: string): Promise<WPPost | undefined> {
  const posts = await getPosts();
  const needle = slug.toLowerCase();
  return posts.find((p) => p.slug.toLowerCase() === needle);
}

/** A single approved, publicly-visible comment on a page. */
export interface WPComment {
  id: number;
  authorName: string;
  /**
   * Already run through WP's own `comment_text` filter (wpautop + linkify)
   * and, before that, sanitized at submission time against a fixed
   * inline-tag allowlist (`wp_kses` on WP's `pre_comment_content` filter) —
   * safe to render raw. Same "trusted HTML" call as page content
   * (IMPLEMENTATION.md §7), but the trust here comes from WP's fixed
   * comment-tag allowlist rather than from the author being an editor.
   */
  content: string;
  date: string;
}

interface RawWPComment {
  id: number;
  author_name: string;
  content: { rendered: string };
  date: string;
}

const COMMENTS_CACHE_TTL_MS = 60_000;
const commentsCache = new Map<number, { comments: WPComment[]; expires: number }>();

/**
 * Approved comments for a page, oldest first. WP's REST API only lets an
 * unauthenticated request (which is all this app ever sends — see the
 * module note at the top of this file) see `status=approve` comments,
 * regardless of what's asked for; anything else 401s. So "fetch as
 * ourselves, no auth header" already *is* the enforcement of "only show what
 * an editor approved in the WP dashboard" — nothing extra to filter here.
 *
 * Cached briefly per page so a busy page doesn't hit WP on every render;
 * unlike page content, a new/approved comment showing up a few seconds late
 * isn't worth wiring the revalidate webhook for.
 */
export async function getApprovedComments(postId: number): Promise<WPComment[]> {
  const now = Date.now();
  const cached = commentsCache.get(postId);
  if (cached && cached.expires > now) return cached.comments;

  const res = await fetch(
    apiUrl(`/comments?post=${postId}&order=asc&orderby=date&per_page=100&_fields=id,author_name,content,date`),
    { headers: NO_CACHE_REQUEST_HEADERS },
  );
  if (!res.ok) {
    throw new Error(`WP comments fetch failed: ${res.status} ${res.statusText}`);
  }

  const raw: RawWPComment[] = await res.json();
  const comments: WPComment[] = raw.map((c) => ({
    id: c.id,
    authorName: he.decode(c.author_name),
    content: c.content.rendered,
    date: c.date,
  }));

  commentsCache.set(postId, { comments, expires: now + COMMENTS_CACHE_TTL_MS });
  return comments;
}

export interface CommentSubmission {
  postId: number;
  authorName: string;
  authorEmail: string;
  content: string;
}

export type SubmitCommentResult =
  | { status: "ok" }
  | { status: "error"; message: string; httpStatus: number };

/**
 * Submits a visitor's comment to WordPress. Lands in whatever moderation
 * state WP itself assigns an anonymous, unauthenticated commenter — normally
 * pending review, unless WP's own auto-approve rules (e.g. a previously
 * approved email on this site) apply — approval always happens in the WP
 * dashboard, never here. The created comment's moderation status isn't
 * readable back from this call (WP only exposes it in "edit" context, which
 * an anonymous submitter doesn't have), so success here just means WP
 * accepted the submission, not that it's already visible.
 *
 * Only called from src/pages/api/comments.ts, which is where visitor input
 * is validated before it ever reaches this function.
 */
export async function submitComment(input: CommentSubmission): Promise<SubmitCommentResult> {
  let res: Response;
  try {
    res = await fetch(`${WP_API_URL}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...NO_CACHE_REQUEST_HEADERS },
      body: JSON.stringify({
        post: input.postId,
        author_name: input.authorName,
        author_email: input.authorEmail,
        content: input.content,
      }),
    });
  } catch {
    return { status: "error", message: "Network error contacting WordPress", httpStatus: 502 };
  }

  if (res.ok) return { status: "ok" };

  // Passed straight through rather than collapsed to a generic 502: WP's
  // rejection here is a genuine, meaningful response (e.g. 401 "you must be
  // logged in to comment" when Settings > Discussion requires registration,
  // or 400 on a missing/invalid field) — a "Bad Gateway" status code on a
  // response that says exactly what's wrong just muddies devtools/logs, and
  // this app's own request to WP itself succeeded fine.
  const body = await res.json().catch(() => null);
  return {
    status: "error",
    message: body?.message ?? `WordPress rejected the comment (${res.status})`,
    httpStatus: res.status,
  };
}

export interface ResolvedPage {
  page: WPPage;
  /** Root-first, for breadcrumbs — see getAncestorRefs. */
  ancestors: WPPage[];
}

/** A page's identity fields only, cached by id — just enough to walk a
 *  parent chain (id/slug/parent) and label a breadcrumb (title). Populated
 *  lazily as getPageByPath walks ancestor chains; cleared by purgeCache(). */
interface PageRef {
  id: number;
  slug: string;
  parent: number;
  title: string;
}

let ancestorRefCache = new Map<number, PageRef>();

async function fetchPageRef(id: number): Promise<PageRef | undefined> {
  const cached = ancestorRefCache.get(id);
  if (cached) return cached;

  const res = await fetch(apiUrl(`/pages/${id}?_fields=id,slug,parent,title`), {
    headers: NO_CACHE_REQUEST_HEADERS,
  });
  if (!res.ok) return undefined;

  const raw = await res.json();
  const ref: PageRef = { id: raw.id, slug: raw.slug, parent: raw.parent, title: he.decode(raw.title.rendered) };
  ancestorRefCache.set(id, ref);
  return ref;
}

/** Root-first chain of ancestor refs by walking `parent` ids one at a time
 *  (each lookup cached — see fetchPageRef) instead of requiring the whole
 *  catalog to already be in memory. A page's hierarchy depth is tiny (2-3
 *  levels in practice) compared to the catalog's total size, so this is a
 *  handful of REST calls regardless of how many pages the site has. */
async function getAncestorRefs(parentId: number): Promise<PageRef[]> {
  const chain: PageRef[] = [];
  const seen = new Set<number>();
  let currentId = parentId;

  while (currentId) {
    if (seen.has(currentId)) break; // guard against a corrupt/circular parent chain
    seen.add(currentId);
    const ref = await fetchPageRef(currentId);
    if (!ref) break;
    chain.unshift(ref);
    currentId = ref.parent;
  }

  return chain;
}

function ancestorRefsToPages(refs: PageRef[]): WPPage[] {
  return refs.map((ref, i) => ({
    id: ref.id,
    slug: ref.slug,
    parent: ref.parent,
    title: ref.title,
    content: "",
    template: "",
    menuOrder: 0,
    date: "",
    yoast: null,
    featuredImage: null,
    // Only this ancestor's own path is knowable from refs alone (no
    // content/template/etc.) — but that's all Breadcrumbs actually reads.
    fullPath: normalizePath(refs.slice(0, i + 1).map((r) => r.slug).join("/")),
    commentsOpen: false,
  }));
}

function toWPPage(raw: RawWPPage, fullPath: string): WPPage {
  return {
    id: raw.id,
    slug: raw.slug,
    parent: raw.parent,
    title: he.decode(raw.title.rendered),
    content: raw.content.rendered,
    template: raw.wp_template ?? "",
    menuOrder: raw.menu_order ?? 0,
    date: raw.date,
    yoast: raw.yoast_head_json ?? null,
    featuredImage: raw._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
    fullPath,
    commentsOpen: raw.comment_status === "open",
  };
}

const PAGE_DETAIL_FIELDS =
  "id,slug,parent,title,content,wp_template,menu_order,date,yoast_head_json,comment_status,_links,_embedded";

/**
 * Resolves a single page's URL directly against WordPress — no full-catalog
 * fetch involved. Looks up every page sharing the URL's leaf slug (a slug is
 * only unique among siblings, not sitewide, so more than one candidate is
 * possible), then walks each candidate's parent chain (cached, see
 * getAncestorRefs) until the one whose computed full path actually matches
 * the requested URL is found. Cost is a handful of REST calls regardless of
 * how large the site's page catalog is.
 */
export async function getPageByPath(path: string): Promise<ResolvedPage | undefined> {
  const normalized = normalizePath(path);
  if (normalized === "" || RESERVED_SLUGS.has(normalized)) return undefined;

  const leafSlug = normalized.split("/").pop()!;
  const res = await fetch(
    apiUrl(`/pages?slug=${encodeURIComponent(leafSlug)}&per_page=100&_embed=wp:featuredmedia&_fields=${PAGE_DETAIL_FIELDS}`),
    { headers: NO_CACHE_REQUEST_HEADERS },
  );
  if (!res.ok) {
    throw new Error(`WP page lookup failed: ${res.status} ${res.statusText}`);
  }
  const candidates: RawWPPage[] = await res.json();

  for (const raw of candidates) {
    const ancestorRefs = await getAncestorRefs(raw.parent);
    const fullPath = normalizePath([...ancestorRefs.map((r) => r.slug), raw.slug].join("/"));
    if (fullPath !== normalized) continue;
    return { page: toWPPage(raw, fullPath), ancestors: ancestorRefsToPages(ancestorRefs) };
  }

  return undefined;
}

const CHILDREN_LIST_FIELDS = "id,slug,parent,title,wp_template,menu_order,date,_links,_embedded";

/** Direct children of `parentId`, scoped with WP's native `?parent=`
 *  filter rather than filtering them out of a full site-wide list.
 *  `parentFullPath` (already known by the caller, which is rendering that
 *  exact parent page) lets each child's fullPath be computed directly
 *  instead of a separate ancestor-chain walk per child. */
export async function getChildren(parentId: number, parentFullPath: string): Promise<WPPage[]> {
  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  const raw: RawWPPageLite[] = [];

  do {
    const res = await fetch(
      apiUrl(`/pages?parent=${parentId}&per_page=${perPage}&page=${page}&_embed=wp:featuredmedia&_fields=${CHILDREN_LIST_FIELDS}`),
      { headers: NO_CACHE_REQUEST_HEADERS },
    );
    if (!res.ok) {
      throw new Error(`WP children fetch failed: ${res.status} ${res.statusText}`);
    }
    totalPages = Number(res.headers.get("X-WP-TotalPages") ?? "1");
    raw.push(...(await res.json()));
    page += 1;
  } while (page <= totalPages);

  return raw
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      parent: p.parent,
      title: he.decode(p.title.rendered),
      content: "",
      template: p.wp_template ?? "",
      menuOrder: p.menu_order ?? 0,
      date: p.date,
      yoast: null,
      featuredImage: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
      fullPath: normalizePath(`${parentFullPath}/${p.slug}`),
      commentsOpen: false,
    }))
    .sort((a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title));
}

/** Siblings of `page` (its parent's other children), scoped the same way as
 *  getChildren rather than filtered out of a full site-wide list. */
export async function getSiblings(page: Pick<WPPage, "id" | "parent" | "fullPath">): Promise<WPPage[]> {
  const parentFullPath = page.fullPath.split("/").slice(0, -1).join("/");
  const siblings = await getChildren(page.parent, parentFullPath);
  return siblings.filter((p) => p.id !== page.id);
}

/**
 * Every page using a WP template ending in `suffix` (e.g. "airlines-parent.php"),
 * regardless of where it sits in the hierarchy — for directory-style listing
 * pages like /airlines. Reuses the same suffix-matching convention as the
 * layout picker in [...slug].astro.
 */
export async function getPagesByTemplateSuffix(suffix: string): Promise<WPPage[]> {
  const tree = await getPageTree();
  const needle = suffix.toLowerCase();
  return tree.list
    .filter((p) => p.template.toLowerCase().endsWith(needle))
    .sort((a, b) => a.menuOrder - b.menuOrder || a.title.localeCompare(b.title));
}

/**
 * The template → layout naming convention (see IMPLEMENTATION.md §4):
 * anything ending in "parent.php" (bare, or prefixed like
 * "parking-parent.php") is a section-parent page; anything ending in
 * "child.php" is a section-child page. Exported so [...slug].astro's layout
 * picker and ChildPageLayout's sibling filter (only show *-child.php
 * siblings) share one definition instead of duplicating the regex.
 */
export function isParentTemplate(template: string): boolean {
  return /(?:^|[-/])parent\.php$/i.test(template);
}

export function isChildTemplate(template: string): boolean {
  return /(?:^|[-/])child\.php$/i.test(template);
}

let siteSettingsCache: { settings: SiteSettings; expires: number } | null = null;

export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (siteSettingsCache && siteSettingsCache.expires > now) {
    return siteSettingsCache.settings;
  }

  const wpRoot = WP_API_URL.replace(/\/wp-json\/wp\/v2\/?$/, "/wp-json");
  const res = await fetch(withCacheBust(wpRoot), { headers: NO_CACHE_REQUEST_HEADERS });
  const settings: SiteSettings = res.ok
    ? { title: (await res.json()).name ?? process.env.SITE_TITLE ?? "" }
    : { title: process.env.SITE_TITLE ?? "" };

  siteSettingsCache = { settings, expires: now + PAGE_TREE_CACHE_TTL_MS };
  return settings;
}

/**
 * Marks the in-memory page-tree cache stale and drops the site-settings,
 * posts, and page-ref caches, so the next request(s) rebuild fresh from
 * WordPress instead of waiting out the TTL above. Called from the
 * /api/revalidate webhook (see wordpress/rest-api-additions.php), which WP
 * pings on publish/update/trash for both pages and posts. The TTL stays in
 * place as a fallback in case the webhook never fires.
 *
 * The page tree isn't dropped outright (contrast postsCache/siteSettingsCache
 * below, cheap enough to just refetch): expiring it in place means
 * getPageTree() keeps serving the previous catalog snapshot — stale-while-
 * revalidate — while the background rebuild runs, rather than every
 * catalog-wide listing (sitemap, homepage, airlines directory) going empty
 * on every single publish/update. `generation` still guards against a
 * rebuild already in flight before this purge landing after it and
 * resurrecting pre-purge data.
 */
export function purgeCache(): void {
  if (cache) cache.expires = 0;
  siteSettingsCache = null;
  postsCache = null;
  ancestorRefCache = new Map();
  generation += 1;
}

export interface ResolvedPageMeta {
  title: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  /** Yoast's raw structured-data graph, still WP-origin URLs - see YoastHead.schema. */
  schema?: YoastHead["schema"];
}

/**
 * Single source of truth for the Yoast-fields-with-fallback rule (IMPLEMENTATION.md §8).
 * Called from BaseLayout and any static page that also needs SEO fallback.
 * Takes the narrow shape it actually needs (not WPPage specifically) so it
 * also works for WPPost — both carry title/yoast, nothing else here matters.
 *
 * Yoast's title/description/og_title/og_description come back HTML-entity
 * encoded (same as title.rendered elsewhere in this file) but are consumed
 * in plain-text contexts (<title>, <meta content>), so they're decoded here
 * too. page.title is already decoded upstream in buildPageTree/buildPosts.
 */
export function resolvePageMeta(page: { title: string; yoast: YoastHead | null }, site: SiteSettings): ResolvedPageMeta {
  const yoast = page.yoast;

  const title =
    yoast?.title && yoast.title.trim().length > 0
      ? he.decode(yoast.title)
      : `${page.title} - ${site.title}`;

  const description =
    yoast?.description && yoast.description.trim().length > 0
      ? he.decode(yoast.description)
      : undefined;

  return {
    title,
    description,
    canonical: yoast?.canonical,
    ogTitle: yoast?.og_title ? he.decode(yoast.og_title) : undefined,
    ogDescription: yoast?.og_description ? he.decode(yoast.og_description) : undefined,
    ogImage: yoast?.og_image?.[0]?.url,
    schema: yoast?.schema,
  };
}