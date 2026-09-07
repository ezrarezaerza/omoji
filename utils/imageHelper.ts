/**
 * Safe Image Helper for Vercel Blob & Cross-Origin Sticker Assets
 *
 * Provides fallback proxying when direct CDN / Vercel Blob requests fail due to
 * browser network policies, COEP/CORP, or privacy extensions.
 */

export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/api/")) {
    return url;
  }
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

/**
 * Handles image load error on <img /> elements by seamlessly failing over to
 * the local same-origin /api/proxy-image endpoint.
 */
export function handleStickerImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  originalUrl?: string
) {
  const target = e.currentTarget;
  const rawUrl = originalUrl || target.getAttribute("src") || "";

  if (
    !target.dataset.retried &&
    rawUrl &&
    !rawUrl.startsWith("data:") &&
    !rawUrl.startsWith("blob:") &&
    !rawUrl.includes("/api/proxy-image")
  ) {
    target.dataset.retried = "true";
    target.src = `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
  }
}
