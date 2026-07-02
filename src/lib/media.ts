// Typed asset model for wedding media.
// Supports Supabase Storage (CDN), Runway (generated video), and Unsplash (stock photos).
// All three share the same WeddingAsset shape so components are source-agnostic.

export type MediaSource = "supabase-storage" | "runway" | "unsplash" | "local";
export type MediaKind = "image" | "video";

export interface WeddingAsset {
  src: string;
  kind: MediaKind;
  source: MediaSource;
  alt?: string;
  /** Natural pixel dimensions — passed to <Image> when fill={false} */
  width?: number;
  height?: number;
  /** Base64 blur placeholder for Next.js <Image> */
  blurDataURL?: string;
  /** Poster frame URL for <video> */
  poster?: string;
  /** e.g. "video/mp4" */
  mimeType?: string;
}

// ── Supabase Storage ───────────────────────────────────────────
// `bucket`: storage bucket name (e.g. "wedding-media")
// `path`:   object key inside the bucket (e.g. "hero/ceremony.mp4")
export function storageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function storageAsset(
  bucket: string,
  path: string,
  kind: MediaKind,
  overrides?: Partial<WeddingAsset>
): WeddingAsset {
  return { src: storageUrl(bucket, path), kind, source: "supabase-storage", ...overrides };
}

// ── Unsplash ───────────────────────────────────────────────────
// Pass `url` from photo.urls.regular / photo.urls.full returned by Unsplash MCP.
export function unsplashAsset(
  url: string,
  alt: string,
  overrides?: Partial<WeddingAsset>
): WeddingAsset {
  return { src: url, kind: "image", source: "unsplash", alt, ...overrides };
}

// ── Runway ─────────────────────────────────────────────────────
// Pass `url` from the Runway generation result and optionally a poster frame URL.
export function runwayAsset(
  url: string,
  poster?: string,
  overrides?: Partial<WeddingAsset>
): WeddingAsset {
  return { src: url, kind: "video", source: "runway", mimeType: "video/mp4", poster, ...overrides };
}
