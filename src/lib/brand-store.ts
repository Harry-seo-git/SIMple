import { BrandGuideline, BrandProfile, GuidelineCategory } from "@/types";

const STORAGE_KEY = "simple-brand-profile";

// ── Category metadata ──

export const GUIDELINE_CATEGORIES: {
  id: GuidelineCategory;
  label: string;
  icon: string;
  placeholder: string;
}[] = [
  {
    id: "color",
    label: "Color",
    icon: "\ud83c\udfa8",
    placeholder: "e.g. Use indigo (#6366F1) as primary, avoid pure black",
  },
  {
    id: "shape",
    label: "Shape",
    icon: "\u2b21",
    placeholder: "e.g. Always use rounded corners (12px+), prefer soft curves",
  },
  {
    id: "typography",
    label: "Typography",
    icon: "Aa",
    placeholder: "e.g. Use geometric sans-serif fonts, bold headings",
  },
  {
    id: "composition",
    label: "Composition",
    icon: "\u25a7",
    placeholder: "e.g. Center-weighted layout, ample whitespace",
  },
  {
    id: "mood",
    label: "Mood",
    icon: "\u2728",
    placeholder: "e.g. Friendly, approachable, modern tech feel",
  },
  {
    id: "constraint",
    label: "Constraint",
    icon: "\u26a0\ufe0f",
    placeholder: "e.g. No photorealistic images, no gradients over text",
  },
  {
    id: "custom",
    label: "Custom",
    icon: "\u270f\ufe0f",
    placeholder: "Write any custom directive for the AI...",
  },
];

// ── Default brand profile with example guidelines ──

const DEFAULT_PROFILE: BrandProfile = {
  id: "usimsa-default",
  name: "\uc720\uc2ec\uc0ac",
  description: "\uc720\uc2ec\uc0ac \ube0c\ub79c\ub4dc \uadf8\ub798\ud53d \uc2a4\ud0c0\uc77c \uac00\uc774\ub4dc\ub77c\uc778",
  guidelines: [
    {
      id: "g-color-1",
      category: "color",
      title: "USIMSA \uceec\ub7ec \ud314\ub808\ud2b8",
      directive:
        "Use USIMSA brand colors: Primary Blue #0066FF as the main accent. Secondary Blue #297EFF and light blue #EBF3FF for backgrounds and highlights. Gold/yellow #FFB800 for point icons and coins. Warm accents with soft sky blue gradients (#A8D4FF to #D6ECFF). Avoid using red except for warnings. Surface colors: white #FFFFFF and light gray #F9F9F9.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-style-1",
      category: "shape",
      title: "\uc18c\ud504\ud2b8 3D \uc77c\ub7ec\uc2a4\ud2b8",
      directive:
        "Create soft 3D illustrated objects with a glossy, toy-like quality. Objects should have gentle gradients, subtle highlights and soft shadows giving them volume and depth. Think clay render or Pixar-style 3D illustrations — rounded, friendly, tactile. Use smooth surfaces with specular highlights. Objects should feel like they exist in physical space with proper lighting from top-left.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-comp-1",
      category: "composition",
      title: "\ud22c\uba85 \ubc30\uacbd + \ub5a0 \uc788\ub294 \uad6c\ub3c4",
      directive:
        "ALWAYS use a fully transparent background (no solid backgrounds, no gradient backgrounds). The main object should be centered. Small secondary elements (coins, icons, sparkles, particles) should float around the main object at various angles and sizes to create dynamism and depth. Objects cast soft drop shadows downward. The composition should feel airy and spacious.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-mood-1",
      category: "mood",
      title: "\ubaa8\ub358 \ud504\ub80c\ub4e4\ub9ac",
      directive:
        "The overall mood should be modern, friendly, and premium but approachable. Clean and bright, not dark or moody. The style evokes trust and reliability (fintech/telecom brand feel). Colors lean cool blue with warm gold accents. Objects should feel delightful and inviting.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-format-1",
      category: "constraint",
      title: "\ucd9c\ub825 \uc81c\uc57d",
      directive:
        "Output size must be 1024x1024 pixels. Background MUST be transparent (use alpha channel / no background fill). No text or typography in the graphic. No photorealistic renders — only stylized 3D illustration. No dark backgrounds. No neon or fluorescent colors. Avoid visual noise or overly complex compositions.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Store functions ──

export function loadProfile(): BrandProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  // First load: seed with defaults
  saveProfile(DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

export function saveProfile(profile: BrandProfile): void {
  if (typeof window === "undefined") return;
  profile.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function addGuideline(
  profile: BrandProfile,
  guideline: Omit<BrandGuideline, "id" | "createdAt">
): BrandProfile {
  const updated: BrandProfile = {
    ...profile,
    guidelines: [
      ...profile.guidelines,
      {
        ...guideline,
        id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      },
    ],
  };
  saveProfile(updated);
  return updated;
}

export function updateGuideline(
  profile: BrandProfile,
  id: string,
  patch: Partial<BrandGuideline>
): BrandProfile {
  const updated: BrandProfile = {
    ...profile,
    guidelines: profile.guidelines.map((g) =>
      g.id === id ? { ...g, ...patch } : g
    ),
  };
  saveProfile(updated);
  return updated;
}

export function removeGuideline(
  profile: BrandProfile,
  id: string
): BrandProfile {
  const updated: BrandProfile = {
    ...profile,
    guidelines: profile.guidelines.filter((g) => g.id !== id),
  };
  saveProfile(updated);
  return updated;
}

export function toggleGuideline(
  profile: BrandProfile,
  id: string
): BrandProfile {
  return updateGuideline(profile, id, {
    enabled: !profile.guidelines.find((g) => g.id === id)?.enabled,
  });
}

/**
 * Build the brand directive block that gets injected into AI prompts.
 * Only includes enabled guidelines.
 */
export function buildBrandDirective(profile: BrandProfile): string {
  const active = profile.guidelines.filter((g) => g.enabled);
  if (active.length === 0) return "";

  const lines = active.map(
    (g) => `[${g.category.toUpperCase()}] ${g.directive}`
  );

  return `=== BRAND GUIDELINES (${profile.name}) ===\nFollow these brand directives strictly:\n${lines.join("\n")}\n=== END GUIDELINES ===`;
}
