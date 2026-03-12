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
      title: "\ud504\ub77c\uc774\uba38\ub9ac \uceec\ub7ec",
      directive:
        "Use indigo (#6366F1) as the primary brand color. Secondary colors are soft violet (#A78BFA) and warm gray (#78716C). Accent with electric blue (#3B82F6) sparingly.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-shape-1",
      category: "shape",
      title: "\ub77c\uc6b4\ub4dc \uc9c0\uc624\uba54\ud2b8\ub9ac",
      directive:
        "Use rounded geometric shapes. Corner radius should be 12px or higher. Prefer circles, rounded rectangles, and soft polygons. No sharp or angular edges.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-mood-1",
      category: "mood",
      title: "\ubaa8\ub358 \ud504\ub80c\ub4e4\ub9ac",
      directive:
        "The overall mood should be modern, friendly, and approachable. Think clean tech aesthetic with warmth. Not cold or corporate.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-comp-1",
      category: "composition",
      title: "\uc900\uc559 \ubc38\ub7f0\uc2a4",
      directive:
        "Center-weighted composition with balanced whitespace. Objects should feel grounded, not floating randomly. Use subtle depth with soft shadows or layering.",
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "g-constraint-1",
      category: "constraint",
      title: "\uae08\uc9c0 \uc694\uc18c",
      directive:
        "Never use photorealistic renders. Avoid neon/fluorescent colors. No busy patterns or visual noise. No text overlapping graphics.",
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
