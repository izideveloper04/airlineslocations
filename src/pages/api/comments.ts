import type { APIRoute } from "astro";
import { submitComment } from "../../lib/wp";

// Same reasoning as flight-search.ts / revalidate.ts — this has to run live
// on the Node process so it can reach WordPress per-request.
export const prerender = false;

const MAX_NAME_LENGTH = 100;
const MAX_CONTENT_LENGTH = 3000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ status: "error", message: "Invalid request body" }, 400);
  }

  // Honeypot: a field real visitors never see or reach (hidden off-screen in
  // CommentSection.astro). A bot that fills every field in the form gets a
  // fake success here so it has no signal the post was dropped, and
  // WordPress never even sees the request.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return jsonResponse({ status: "ok" }, 200);
  }

  const postId = Number(body.postId);
  const authorName = String(body.authorName ?? "").trim();
  const authorEmail = String(body.authorEmail ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!Number.isInteger(postId) || postId <= 0) {
    return jsonResponse({ status: "error", message: "Missing or invalid page" }, 400);
  }
  if (!authorName || authorName.length > MAX_NAME_LENGTH) {
    return jsonResponse({ status: "error", message: "Please enter your name" }, 400);
  }
  if (!EMAIL_PATTERN.test(authorEmail)) {
    return jsonResponse({ status: "error", message: "Please enter a valid email address" }, 400);
  }
  if (!content || content.length > MAX_CONTENT_LENGTH) {
    return jsonResponse(
      { status: "error", message: `Comment must be between 1 and ${MAX_CONTENT_LENGTH} characters` },
      400,
    );
  }

  const result = await submitComment({ postId, authorName, authorEmail, content });
  return jsonResponse(result, result.status === "error" ? result.httpStatus : 200);
};
