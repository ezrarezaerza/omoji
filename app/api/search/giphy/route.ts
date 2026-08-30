export interface GiphyItemResponse {
  id: string;
  title: string;
  previewUrl: string;
  fullUrl: string;
  mp4Url?: string;
  webpUrl?: string;
  width: number;
  height: number;
  slug?: string;
}

export interface GiphySearchApiResponse {
  success: boolean;
  data: GiphyItemResponse[];
  pagination?: {
    total_count: number;
    count: number;
    offset: number;
  };
  error?: string;
}

// Fallback curated GIFs if Giphy API limit is reached or offline
const FALLBACK_GIFS: GiphyItemResponse[] = [
  {
    id: "fallback-cat-vibing",
    title: "Cat Vibing Meme",
    previewUrl: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
    fullUrl: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif",
    mp4Url: "https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.mp4",
    width: 480,
    height: 480,
  },
  {
    id: "fallback-doge-dance",
    title: "Doge Dancing Celebration",
    previewUrl: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
    fullUrl: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
    mp4Url: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.mp4",
    width: 500,
    height: 500,
  },
  {
    id: "fallback-pop-cat",
    title: "Pop Cat GIF",
    previewUrl: "https://media.giphy.com/media/ZeB5RzwVUoxWg2EvEl/giphy.gif",
    fullUrl: "https://media.giphy.com/media/ZeB5RzwVUoxWg2EvEl/giphy.gif",
    width: 400,
    height: 400,
  },
  {
    id: "fallback-mind-blown",
    title: "Mind Blown Reaction",
    previewUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    fullUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    width: 480,
    height: 270,
  },
  {
    id: "fallback-happy-dance",
    title: "Happy Dance Celebration",
    previewUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    fullUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    width: 500,
    height: 375,
  },
  {
    id: "fallback-deal-with-it",
    title: "Deal With It Glasses",
    previewUrl: "https://media.giphy.com/media/xUPGcxpCV81ebKh7Vu/giphy.gif",
    fullUrl: "https://media.giphy.com/media/xUPGcxpCV81ebKh7Vu/giphy.gif",
    width: 480,
    height: 480,
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

    // Priority: custom GIPHY_API_KEY, or public fallback demo keys
    const apiKey = process.env.GIPHY_API_KEY || "dc6zaTOxFJmzC";

    const endpoint = query
      ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=en`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&offset=${offset}&rating=g`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let giphyResponse;
    try {
      giphyResponse = await fetch(endpoint, {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!giphyResponse.ok) {
      console.warn(`Giphy API responded with status ${giphyResponse.status}. Falling back to curated results.`);
      // If Giphy API limit or key issue occurs, return filtered fallback list
      const filtered = query
        ? FALLBACK_GIFS.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()))
        : FALLBACK_GIFS;

      return new Response(
        JSON.stringify({
          success: true,
          data: filtered.length > 0 ? filtered : FALLBACK_GIFS,
          pagination: {
            total_count: FALLBACK_GIFS.length,
            count: filtered.length,
            offset: 0,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    }

    const json = await giphyResponse.json();
    const rawData = Array.isArray(json.data) ? json.data : [];

    const formattedData: GiphyItemResponse[] = rawData.map((item: any) => {
      const images = item.images || {};
      const preview =
        images.fixed_height_small?.url ||
        images.fixed_width_downsampled?.url ||
        images.downsized?.url ||
        images.preview_gif?.url ||
        images.original?.url ||
        "";

      const full =
        images.original?.url ||
        images.downsized_medium?.url ||
        images.fixed_height?.url ||
        preview;

      return {
        id: String(item.id || Math.random().toString(36).substring(2)),
        title: item.title || "Giphy Animated Meme",
        previewUrl: preview,
        fullUrl: full,
        mp4Url: images.original?.mp4 || images.looping?.mp4 || images.downsized_small?.mp4,
        webpUrl: images.original?.webp || images.fixed_height?.webp,
        width: parseInt(images.original?.width || "512", 10),
        height: parseInt(images.original?.height || "512", 10),
        slug: item.slug || "",
      };
    });

    const responseBody: GiphySearchApiResponse = {
      success: true,
      data: formattedData,
      pagination: {
        total_count: json.pagination?.total_count || formattedData.length,
        count: json.pagination?.count || formattedData.length,
        offset: json.pagination?.offset || offset,
      },
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error("Giphy search route error:", error);

    // Graceful fallback on network exception
    return new Response(
      JSON.stringify({
        success: true,
        data: FALLBACK_GIFS,
        pagination: {
          total_count: FALLBACK_GIFS.length,
          count: FALLBACK_GIFS.length,
          offset: 0,
        },
        error: error?.message || "Failed to fetch from Giphy",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
