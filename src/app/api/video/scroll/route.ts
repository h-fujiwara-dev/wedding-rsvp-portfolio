import { NextRequest, NextResponse } from "next/server";

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGIN_URL =
  `${MEDIA_BASE_URL}/storage/v1/object/public/wedding-assets/video/scroll-optimized.mp4`;

const CONTENT_LENGTH = "15191618"; // 14.5 MB — ALL-I 1080p re-encode

// Shared response headers — guarantees Accept-Ranges, fixes browser media-loader
const BASE_HEADERS = {
  "Content-Type":  "video/mp4",
  "Accept-Ranges": "bytes",
  "Cache-Control": "public, max-age=31536000, immutable",
};

// HEAD — Chrome's video element probes this before streaming.
// Supabase CDN returns 503 on HEAD for paths with spaces; proxy returns 200.
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { ...BASE_HEADERS, "Content-Length": CONTENT_LENGTH },
  });
}

// GET — supports byte-range requests so Chrome can seek without re-downloading
export async function GET(req: NextRequest) {
  const range = req.headers.get("range");

  const upstream = await fetch(ORIGIN_URL, {
    headers: range ? { Range: range } : {},
    // Next.js caches fetch by default; opt out so range responses aren't stale
    cache: "no-store",
  });

  const responseHeaders: Record<string, string> = { ...BASE_HEADERS };

  const contentRange  = upstream.headers.get("content-range");
  const contentLength = upstream.headers.get("content-length");
  if (contentRange)  responseHeaders["Content-Range"]  = contentRange;
  if (contentLength) responseHeaders["Content-Length"] = contentLength;

  return new NextResponse(upstream.body, {
    status: upstream.status, // 206 for range, 200 for full
    headers: responseHeaders,
  });
}
