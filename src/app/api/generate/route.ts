import { NextRequest, NextResponse } from "next/server";
import { GenerationRequest, GeneratedAsset, BrandGuideline } from "@/types";
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
 * Brand guidelines are injected into the prompt for all models.
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { model, prompt, style, outputFormat, brandGuidelines } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build full prompt: user prompt + style + brand guidelines
    const stylePreset = STYLE_PRESETS.find((s) => s.id === style);
    const brandBlock = buildBrandBlock(brandGuidelines);
    const fullPrompt = stylePreset
      ? `${prompt}. Style: ${stylePreset.prompt_modifier}${brandBlock}`
      : `${prompt}${brandBlock}`;

    console.log("[SIMple] Full prompt for", model, ":\n", fullPrompt);

    let asset: GeneratedAsset;

    // Demo: generate a placeholder SVG graphic
    // Real API integrations will go here per model
    switch (model) {
      case "claude": {
        const svgCode = generateDemoSVG(fullPrompt, "claude");
        asset = {
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
        break;
      }
      case "openai": {
        // TODO: integrate OpenAI DALL-E / gpt-image API
        const svgCode = generateDemoSVG(fullPrompt, "openai");
        asset = {
          id: crypto.randomUUID(),
          prompt: fullPrompt,
          model: "openai",
          format: outputFormat,
          url: `data:image/svg+xml,${encodeURIComponent(svgCode)}`,
          svgCode,
          createdAt: new Date().toISOString(),
          tags: style ? [style] : [],
          width: 400,
          height: 400,
        };
        break;
      }
      case "gemini": {
        // TODO: integrate Google Gemini Imagen API
        const svgCode = generateDemoSVG(fullPrompt, "gemini");
        asset = {
          id: crypto.randomUUID(),
          prompt: fullPrompt,
          model: "gemini",
          format: outputFormat,
          url: `data:image/svg+xml,${encodeURIComponent(svgCode)}`,
          svgCode,
          createdAt: new Date().toISOString(),
          tags: style ? [style] : [],
          width: 400,
          height: 400,
        };
        break;
      }
      default:
        return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
    }

    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({ asset });
  } catch (err) {
    console.error("Generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate a demo SVG based on model type.
 * This is a placeholder until real AI APIs are integrated.
 */
function generateDemoSVG(prompt: string, model: string): string {
  const seed = hashCode(prompt);
  const hue1 = Math.abs(seed) % 360;
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 140) % 360;

  const modelColors: Record<string, { primary: string; secondary: string }> = {
    claude: { primary: `hsl(${hue1}, 70%, 55%)`, secondary: `hsl(${hue2}, 60%, 65%)` },
    openai: { primary: `hsl(${hue1}, 65%, 50%)`, secondary: `hsl(${hue3}, 55%, 60%)` },
    gemini: { primary: `hsl(${hue1}, 75%, 60%)`, secondary: `hsl(${hue2}, 70%, 70%)` },
  };

  const colors = modelColors[model] || modelColors.claude;
  const shapes = generateShapes(seed, colors);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.primary}"/>
      <stop offset="100%" stop-color="${colors.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="24" fill="url(#bg)"/>
  ${shapes}
  <text x="200" y="380" text-anchor="middle" fill="${colors.primary}" font-family="system-ui" font-size="10" opacity="0.5">SIMple \u00b7 ${model}</text>
</svg>`;
}

function generateShapes(seed: number, colors: { primary: string; secondary: string }): string {
  const shapes: string[] = [];
  const count = 4 + (Math.abs(seed) % 5);

  for (let i = 0; i < count; i++) {
    const x = 60 + ((seed * (i + 1) * 37) % 280);
    const y = 60 + ((seed * (i + 1) * 53) % 280);
    const size = 30 + ((seed * (i + 1) * 17) % 80);
    const opacity = 0.15 + (((seed * (i + 1)) % 60) / 100);
    const shapeType = Math.abs(seed * (i + 1)) % 3;
    const color = i % 2 === 0 ? colors.primary : colors.secondary;

    if (shapeType === 0) {
      shapes.push(`<circle cx="${x}" cy="${y}" r="${size / 2}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`);
    } else if (shapeType === 1) {
      shapes.push(`<rect x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" rx="${size / 6}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`);
    } else {
      const r = size / 2;
      const points = Array.from({ length: 6 }, (_, j) => {
        const angle = (Math.PI / 3) * j - Math.PI / 2;
        return `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`;
      }).join(" ");
      shapes.push(`<polygon points="${points}" fill="${color}" opacity="${opacity.toFixed(2)}"/>`);
    }
  }

  // Add a central focal element
  shapes.push(`<circle cx="200" cy="190" r="45" fill="url(#accent)" opacity="0.6"/>`);
  shapes.push(`<circle cx="200" cy="190" r="20" fill="white" opacity="0.9"/>`);

  return shapes.join("\n  ");
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
