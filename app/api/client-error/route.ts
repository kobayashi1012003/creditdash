import type { NextRequest } from "next/server";

/**
 * Where a page that crashed in someone's browser reports it, so the owner
 * can see it in Workers Logs instead of it vanishing in their console.
 * No third-party error service (no running cost, no extra script, no CSP
 * origin), and nothing that identifies the person: the error's message and
 * digest, the page path and the live commit.
 *
 * Same-origin only, small, and never trusted: every field is clipped and
 * logged as text. It always answers 204, so it cannot be used to probe
 * anything.
 */

const MAX_BODY = 4 * 1024;

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return new Response(null, { status: 204 });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return new Response(null, { status: 204 });
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text.length <= MAX_BODY) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // A malformed report is still worth a line.
  }

  console.error(
    "client-error",
    JSON.stringify({
      message: clip(body.message, 300),
      digest: clip(body.digest, 64),
      path: clip(body.path, 200),
      sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? null,
    }),
  );
  return new Response(null, { status: 204 });
}
