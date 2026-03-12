import { NextRequest, NextResponse } from "next/server";
import { GenerationRequest, GeneratedAsset, BrandGuideline, OutputFormat } from "@/types";
import { STYLE_PRESETS } from "@/lib/ai-models";

/**
 * Build the brand directive block from active guidelines.
 */
function buildBrandBlock(guidelines?: BrandGuideline[]): string {
  if (!guidelines || guidelines.length === 0) return "";
  const lines = guidelines
    .filter((g) => g.enabled)
    .map((g) => `[${g.category.toUpperCase()}] ${g.directive}`);
  if (lines.length === 0) return "";
  return `\n\n=== BRAND GUIDELINES ===\nFollow these brand directives strictly:\n${lines.join("\n")}\n=== END GUIDELINES ===`;
}

/**
 * POST /api/generate
 * Generates a graphic asset using the selected AI model.
 * Requires the user's API key sent in the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { model, prompt, style, outputFormat, brandGuidelines, apiKey } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build full prompt
    const stylePreset = STYLE_PRESETS.find((s) => s.id === style);
    const brandBlock = buildBrandBlock(brandGuidelines);
    const fullPrompt = stylePreset
      ? `${prompt}. Style: ${stylePreset.prompt_modifier}${brandBlock}`
      : `${prompt}${brandBlock}`;

    // If no API key, fall back to demo mode
    if (!apiKey) {
      console.log("[SIMple] No API key — using demo mode for", model);
      return generateDemo(fullPrompt, model, style, outputFormat);
    }

    console.log("[SIMple] Generating with", model, "| prompt length:", fullPrompt.length);

    let asset: GeneratedAsset;

    switch (model) {
      case "claude":
        asset = await generateWithClaude(apiKey, fullPrompt, style);
        break;
      case "openai":
        asset = await generateWithOpenAI(apiKey, fullPrompt, style, outputFormat);
        break;
      case "gemini":
        asset = await generateWithGemini(apiKey, fullPrompt, style, outputFormat);
        break;
      default:
        return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
    }

    return NextResponse.json({ asset });
  } catch (err) {
    console.error("Generation error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Claude (Anthropic) ───────────────────────────────────────────────────────
// Uses Claude to generate SVG code directly

async function generateWithClaude(
  apiKey: string,
  fullPrompt: string,
  style?: string
): Promise<GeneratedAsset> {
  const systemPrompt = `You are an expert SVG graphic designer. Generate a single, clean, production-quality SVG graphic based on the user's description.

Rules:
- Output ONLY the raw SVG code, no markdown, no explanation
- Use viewBox="0 0 400 400" with width="400" height="400"
- Use modern design: gradients, rounded corners, clean shapes
- Use the xmlns="http://www.w3.org/2000/svg" attribute
- Do NOT include any JavaScript or external references
- Make the design visually appealing and professional
- If brand guidelines are provided, follow them strictly`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate an SVG graphic: ${fullPrompt}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = (errorData as { error?: { message?: string } })?.error?.message || `Anthropic API error: ${res.status}`;
    throw new Error(errorMsg);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
  let svgCode = textBlock?.text || "";

  // Extract SVG from potential markdown code blocks
  const svgMatch = svgCode.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    svgCode = svgMatch[0];
  }

  if (!svgCode.includes("<svg")) {
    throw new Error("Claude did not return valid SVG code. Try a different prompt.");
  }

  return {
    id: crypto.randomUUID(),
    prompt: fullPrompt,
    model: "claude",
    format: "svg",
    url: `data:image/svg+xml,${encodeURIComponent(svgCode)}`,
    svgCode,
    createdAt: new Date().toISOString(),
    tags: style ? [style] : [],
    width: 400,
    height: 400,
  };
}

// ─── OpenAI (DALL-E / GPT-Image) ─────────────────────────────────────────────

async function generateWithOpenAI(
  apiKey: string,
  fullPrompt: string,
  style?: string,
  outputFormat?: OutputFormat
): Promise<GeneratedAsset> {
  // Try gpt-image-1 first (newer), fall back to dall-e-3
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errObj = errorData as { error?: { message?: string } };

    // If gpt-image-1 not available, try dall-e-3
    if (res.status === 404 || errObj?.error?.message?.includes("model")) {
      return generateWithDallE3(apiKey, fullPrompt, style, outputFormat);
    }

    throw new Error(errObj?.error?.message || `OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  const imageData = data.data?.[0];

  if (!imageData) {
    throw new Error("OpenAI returned no image data");
  }

  // gpt-image-1 returns base64
  const imageUrl = imageData.b64_json
    ? `data:image/png;base64,${imageData.b64_json}`
    : imageData.url;

  return {
    id: crypto.randomUUID(),
    prompt: fullPrompt,
    model: "openai",
    format: outputFormat === "svg" ? "png" : (outputFormat || "png"),
    url: imageUrl,
    createdAt: new Date().toISOString(),
    tags: style ? [style] : [],
    width: 1024,
    height: 1024,
  };
}

async function generateWithDallE3(
  apiKey: string,
  fullPrompt: string,
  style?: string,
  outputFormat?: OutputFormat
): Promise<GeneratedAsset> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as { error?: { message?: string } })?.error?.message || `DALL-E API error: ${res.status}`);
  }

  const data = await res.json();
  const imageData = data.data?.[0];

  if (!imageData) {
    throw new Error("DALL-E returned no image data");
  }

  const imageUrl = imageData.b64_json
    ? `data:image/png;base64,${imageData.b64_json}`
    : imageData.url;

  return {
    id: crypto.randomUUID(),
    prompt: fullPrompt,
    model: "openai",
    format: outputFormat === "svg" ? "png" : (outputFormat || "png"),
    url: imageUrl,
    createdAt: new Date().toISOString(),
    tags: style ? [style] : [],
    width: 1024,
    height: 1024,
  };
}

// ─── Gemini (Google) ──────────────────────────────────────────────────────────

async function generateWithGemini(
  apiKey: string,
  fullPrompt: string,
  style?: string,
  outputFormat?: OutputFormat
): Promise<GeneratedAsset> {
  // Use Gemini 2.0 Flash with image generation
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a high-quality graphic image based on this description: ${fullPrompt}. Make it visually stunning and professional.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errObj = errorData as { error?: { message?: string } };
    throw new Error(errObj?.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini returned no results");
  }

  const parts = candidates[0].content?.parts || [];

  // Look for inline image data
  const imagePart = parts.find((p: { inlineData?: { mimeType: string } }) => p.inlineData?.mimeType?.startsWith("image/"));
  if (imagePart?.inlineData) {
    const { mimeType, data: b64Data } = imagePart.inlineData;
    const imageUrl = `data:${mimeType};base64,${b64Data}`;

    return {
      id: crypto.randomUUID(),
      prompt: fullPrompt,
      model: "gemini",
      format: outputFormat === "svg" ? "png" : (outputFormat || "png"),
      url: imageUrl,
      createdAt: new Date().toISOString(),
      tags: style ? [style] : [],
      width: 1024,
      height: 1024,
    };
  }

  // If no image, check if Gemini returned text (maybe SVG code)
  const textPart = parts.find((p: { text?: string }) => p.text);
  if (textPart?.text) {
    const svgMatch = textPart.text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      const svgCode = svgMatch[0];
      return {
        id: crypto.randomUUID(),
        prompt: fullPrompt,
        model: "gemini",
        format: "svg",
        url: `data:image/svg+xml,${encodeURIComponent(svgCode)}`,
        svgCode,
        createdAt: new Date().toISOString(),
        tags: style ? [style] : [],
        width: 400,
        height: 400,
      };
    }
  }

  throw new Error("Gemini did not return an image. Try a different prompt or check your API key permissions.");
}

// ─── Demo mode (no API key) ──────────────────────────────────────────────────

function generateDemo(fullPrompt: string, model: string, style?: string, outputFormat?: OutputFormat) {
  const seed = hashCode(fullPrompt);
  const hue1 = Math.abs(seed) % 360;
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 140) % 360;

  const modelColors: Record<string, { primary: string; secondary: string }> = {
    claude: { primary: `hsl(${hue1}, 70%, 55%)`, secondary: `hsl(${hue2}, 60%, 65%)` },
    openai: { primary: `hsl(${hue1}, 65%, 50%)`, secondary: `hsl(${hue3}, 55%, 60%)` },
    gemini: { primary: `hsl(${hue1}, 75%, 60%)`, secondary: `hsl(${hue2}, 70%, 70%)` },
  };
  const colors = modelColors[model] || modelColors.claude;

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="0.12"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="24" fill="url(#bg)"/>
  <circle cx="200" cy="170" r="60" fill="${colors.primary}" opacity="0.3"/>
  <circle cx="200" cy="170" r="30" fill="${colors.secondary}" opacity="0.6"/>
  <text x="200" y="270" text-anchor="middle" fill="${colors.primary}" font-family="system-ui" font-size="14" font-weight="bold" opacity="0.7">DEMO MODE</text>
  <text x="200" y="295" text-anchor="middle" fill="${colors.primary}" font-family="system-ui" font-size="10" opacity="0.4">Connect API key in Settings to generate real graphics</text>
  <text x="200" y="380" text-anchor="middle" fill="${colors.primary}" font-family="system-ui" font-size="10" opacity="0.3">SIMple \u00b7 ${model}</text>
</svg>`;

  const asset: GeneratedAsset = {
    id: crypto.randomUUID(),
    prompt: fullPrompt,
    model: model as GeneratedAsset["model"],
    format: (outputFormat as GeneratedAsset["format"]) || "svg",
    url: `data:image/svg+xml,${encodeURIComponent(svgCode)}`,
    svgCode,
    createdAt: new Date().toISOString(),
    tags: style ? [style] : [],
    width: 400,
    height: 400,
  };

  return NextResponse.json({ asset, demo: true });
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
