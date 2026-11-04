/**
 * Which commit is live. Read by .github/workflows/ops.yml after every push
 * and once a day, because Cloudflare posts nothing back to GitHub and the
 * Git connection has already broken silently once.
 *
 * Prerendered at build time (the value is fixed per build), so it costs no
 * rendering per request.
 */
export function GET() {
  return Response.json(
    { sha: process.env.NEXT_PUBLIC_BUILD_SHA },
    { headers: { "Cache-Control": "no-store" } },
  );
}
