import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/figma/push
 * Push an asset to a Figma file via the Figma REST API.
 *
 * Body: { fileKey: string, svgCode: string, name: string }
 *
 * In demo mode (no Figma token), returns a simulated success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileKey, svgCode, name } = body;

    if (!svgCode) {
      return NextResponse.json({ error: "svgCode is required" }, { status: 400 });
    }

    // For now: server-side Figma token would come from session/cookie
    // In current demo mode, we simulate the push
    const figmaToken = process.env.FIGMA_ACCESS_TOKEN;

    if (!figmaToken) {
      // Demo mode
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({
        success: true,
        message: "Asset pushed to Figma (demo mode)",
        nodeId: `demo-node-${Date.now()}`,
        fileKey: fileKey || "demo-file",
      });
    }

    // Real Figma API: upload image
    // 1. Convert SVG to PNG via server-side rendering (requires sharp or canvas)
    // 2. Upload to Figma via POST /v1/images/:file_key
    // For now, we use the Figma REST API to create a comment with the asset info

    // Upload SVG as image
    const svgBuffer = Buffer.from(svgCode, "utf-8");

    const uploadRes = await fetch(
      `https://api.figma.com/v1/images/${fileKey}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${figmaToken}`,
          "Content-Type": "image/svg+xml",
        },
        body: svgBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("[Figma Push] Upload failed:", errorText);
      return NextResponse.json(
        { error: "Failed to upload to Figma", details: errorText },
        { status: 502 }
      );
    }

    const uploadData = await uploadRes.json();

    // Post a comment to note the asset was pushed
    if (fileKey) {
      await fetch(`https://api.figma.com/v1/files/${fileKey}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${figmaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `[SIMple] Asset pushed: "${name || "Untitled"}"`,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Asset pushed to Figma",
      imageRef: uploadData.meta?.image_ref,
      fileKey,
    });
  } catch (err) {
    console.error("[Figma Push] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
