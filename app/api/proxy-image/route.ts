export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required 'url' query parameter" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Validate URL protocol
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid target URL format. Must be http:// or https://" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Fetch the remote media resource with custom User-Agent to avoid scraping blockers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let remoteResponse: Response;
    try {
      remoteResponse = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/*,video/*,*/*;q=0.8",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!remoteResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `Remote resource returned HTTP ${remoteResponse.status}: ${remoteResponse.statusText}`,
        }),
        {
          status: remoteResponse.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Read the binary array buffer
    const arrayBuffer = await remoteResponse.arrayBuffer();

    // Determine content type from remote response or file extension
    let contentType = remoteResponse.headers.get("content-type");
    if (!contentType || contentType === "application/octet-stream" || contentType === "text/plain") {
      const lowerUrl = parsedUrl.pathname.toLowerCase();
      if (lowerUrl.endsWith(".gif")) {
        contentType = "image/gif";
      } else if (lowerUrl.endsWith(".png")) {
        contentType = "image/png";
      } else if (lowerUrl.endsWith(".webp")) {
        contentType = "image/webp";
      } else if (lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg")) {
        contentType = "image/jpeg";
      } else if (lowerUrl.endsWith(".mp4")) {
        contentType = "video/mp4";
      } else {
        contentType = "image/gif";
      }
    }

    // Return the piped binary data with permissive CORS and caching headers
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Length": String(arrayBuffer.byteLength),
      },
    });
  } catch (error: any) {
    console.error("CORS Image Proxy Error:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to proxy remote media resource",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
