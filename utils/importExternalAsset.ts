/**
 * Fetches an external image/gif/video asset via our server-side CORS proxy (/api/proxy-image)
 * and converts the returned binary data into a standard JavaScript File object.
 */
export async function importAssetFromUrl(url: string): Promise<File> {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided to importAssetFromUrl");
  }

  const trimmedUrl = url.trim();
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(trimmedUrl)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    let errorDetails = "";
    try {
      const errJson = await response.json();
      errorDetails = errJson.error || "";
    } catch {
      // not json
    }
    throw new Error(
      errorDetails || `Failed to fetch asset via proxy (HTTP ${response.status}: ${response.statusText})`
    );
  }

  const blob = await response.blob();
  let contentType = blob.type;

  // Derive a clean filename
  let fileName = "imported_asset";
  try {
    const parsed = new URL(trimmedUrl);
    const pathnameParts = parsed.pathname.split("/").filter(Boolean);
    if (pathnameParts.length > 0) {
      fileName = pathnameParts[pathnameParts.length - 1].split("?")[0];
    }
  } catch {
    // fallback
  }

  // Refine content type if missing or octet-stream
  const lowerName = fileName.toLowerCase();
  const lowerUrl = trimmedUrl.toLowerCase();

  if (!contentType || contentType === "application/octet-stream" || contentType === "text/plain") {
    if (lowerName.endsWith(".gif") || lowerUrl.endsWith(".gif") || lowerUrl.includes(".gif")) {
      contentType = "image/gif";
    } else if (lowerName.endsWith(".mp4") || lowerUrl.endsWith(".mp4") || lowerUrl.includes(".mp4")) {
      contentType = "video/mp4";
    } else if (lowerName.endsWith(".webp") || lowerUrl.endsWith(".webp")) {
      contentType = "image/webp";
    } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else {
      contentType = "image/png";
    }
  }

  if (!fileName.includes(".")) {
    let extension = "png";
    if (contentType.includes("gif")) extension = "gif";
    else if (contentType.includes("mp4")) extension = "mp4";
    else if (contentType.includes("webp")) extension = "webp";
    else if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = "jpg";
    fileName = `${fileName}_${Date.now()}.${extension}`;
  }

  return new File([blob], fileName, { type: contentType });
}
