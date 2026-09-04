import { promises as fs } from "fs";
import os from "os";
import path from "path";

const jsonResponse = (
  data: any,
  init?: { status?: number; headers?: Record<string, string> }
) => {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
};

export const dynamic = "force-dynamic";

/**
 * High-Precision Neural Background Removal API Endpoint
 * Runs server-side neural IS-Net segmentation on Node.js using @imgly/background-removal-node.
 */
export async function POST(req: Request) {
  let tempFilePath: string | null = null;

  try {
    const contentType = req.headers.get("content-type") || "";
    let imageBuffer: Buffer | null = null;
    let mimeType = "image/png";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const rawData = body.image || "";
      if (!rawData) {
        return jsonResponse({ success: false, error: "Missing image field" }, { status: 400 });
      }
      const match = rawData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (match) {
        mimeType = `image/${match[1]}`;
        imageBuffer = Buffer.from(match[2], "base64");
      } else {
        imageBuffer = Buffer.from(rawData, "base64");
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (file) {
        mimeType = file.type || "image/png";
        imageBuffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      const rawBuffer = Buffer.from(await req.arrayBuffer());
      if (rawBuffer.length > 0) {
        imageBuffer = rawBuffer;
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return jsonResponse({ success: false, error: "No valid image data received" }, { status: 400 });
    }

    // Determine extension
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg")
      ? "jpg"
      : mimeType.includes("webp")
      ? "webp"
      : "png";

    // Write buffer to temporary file for neural processing
    const tempFileName = `cutout_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);
    await fs.writeFile(tempFilePath, imageBuffer);

    // Dynamically load the neural model engine
    const { removeBackground } = await import("@imgly/background-removal-node");

    // Execute neural background segmentation
    const resultBlob = await removeBackground(tempFilePath, {
      output: {
        format: "image/png",
        quality: 1.0,
      },
    });

    const outputArrayBuffer = await resultBlob.arrayBuffer();
    const outputBuffer = Buffer.from(outputArrayBuffer);
    const resultBase64 = `data:image/png;base64,${outputBuffer.toString("base64")}`;

    return jsonResponse({
      success: true,
      imageUrl: resultBase64,
      size: outputBuffer.length,
    });
  } catch (error: any) {
    console.error("Neural background removal server error:", error);
    return jsonResponse(
      {
        success: false,
        error: error.message || "Failed to remove background",
      },
      { status: 500 }
    );
  } finally {
    if (tempFilePath) {
      fs.unlink(tempFilePath).catch(() => {});
    }
  }
}
