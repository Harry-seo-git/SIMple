import { AIModelConfig, StylePreset } from "@/types";

export const AI_MODELS: AIModelConfig[] = [
  {
    id: "claude",
    name: "Claude",
    description: "Anthropic Claude \u2014 SVG \ucf54\ub4dc \uc0dd\uc131 \ubc0f \ub17c\ub9ac\uc801 \ub514\uc790\uc778\uc5d0 \uac15\uc810",
    icon: "\u2728",
    capabilities: ["SVG \ucf54\ub4dc \uc0dd\uc131", "\ub514\uc790\uc778 \ub17c\ub9ac", "\ud504\ub86c\ud504\ud2b8 \ucd5c\uc801\ud654"],
    outputFormats: ["svg", "png"],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "DALL-E / GPT-Image \u2014 \uace0\ud488\uc9c8 \ub798\uc2a4\ud130 \uc774\ubbf8\uc9c0 \uc0dd\uc131",
    icon: "\ud83c\udf1f",
    capabilities: ["\ub798\uc2a4\ud130 \uc774\ubbf8\uc9c0", "\ud3ec\ud1a0\ub9ac\uc5bc\ub9ac\uc2a4\ud2f1", "\uc2a4\ud0c0\uc77c \ub2e4\uc591\uc131"],
    outputFormats: ["png"],
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Google Gemini Imagen \u2014 \uba40\ud2f0\ubaa8\ub2ec \uc774\ubbf8\uc9c0 \uc0dd\uc131 \ubc0f \ud3b8\uc9d1",
    icon: "\ud83d\udc8e",
    capabilities: ["\uc774\ubbf8\uc9c0 \uc0dd\uc131", "\uba40\ud2f0\ubaa8\ub2ec \ud3b8\uc9d1", "\uc2a4\ud0c0\uc77c \ubcc0\ud658"],
    outputFormats: ["png"],
  },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "minimal",
    name: "\ubbf8\ub2c8\uba40",
    description: "\uae68\ub057\ud558\uace0 \ub2e8\uc21c\ud55c \ub514\uc790\uc778",
    prompt_modifier: "minimalist, clean lines, simple shapes, modern",
  },
  {
    id: "geometric",
    name: "\uc9c0\uc624\uba54\ud2b8\ub9ad",
    description: "\uae30\ud558\ud559\uc801 \ud328\ud134\uacfc \ub3c4\ud615",
    prompt_modifier: "geometric patterns, abstract shapes, mathematical precision",
  },
  {
    id: "gradient",
    name: "\uadf8\ub77c\ub514\uc5b8\ud2b8",
    description: "\ubd80\ub4dc\ub7ec\uc6b4 \uc0c9\uc0c1 \uc804\ud658",
    prompt_modifier: "smooth gradients, vibrant colors, flowing transitions",
  },
  {
    id: "isometric",
    name: "\uc544\uc774\uc18c\uba54\ud2b8\ub9ad",
    description: "3D \uc544\uc774\uc18c\uba54\ud2b8\ub9ad \uc2a4\ud0c0\uc77c",
    prompt_modifier: "isometric view, 3D perspective, technical illustration style",
  },
  {
    id: "line-art",
    name: "\ub77c\uc778\uc544\ud2b8",
    description: "\uc120\uc73c\ub85c\ub9cc \ud45c\ud604\ud558\ub294 \uc2a4\ud0c0\uc77c",
    prompt_modifier: "line art, outline only, single stroke weight, monochrome",
  },
  {
    id: "flat",
    name: "\ud50c\ub7ab \ub514\uc790\uc778",
    description: "\uadf8\ub9bc\uc790 \uc5c6\ub294 \ud50c\ub7ab \uc2a4\ud0c0\uc77c",
    prompt_modifier: "flat design, no shadows, bold colors, simple shapes",
  },
];

export function getModelById(id: string): AIModelConfig | undefined {
  return AI_MODELS.find((m) => m.id === id);
}
