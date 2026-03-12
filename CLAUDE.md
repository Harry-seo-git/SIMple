# CLAUDE.md — SIMple AI Graphic Creator

## Project Overview

SIMple is a Next.js 15 web application that generates AI-powered graphic assets (SVG/PNG) using multiple AI models (Claude, OpenAI, Gemini). It includes brand guideline management and Figma integration for syncing generated assets. A companion Figma plugin lives in `figma-plugin/`.

**Primary language:** Korean (UI defaults and brand profile use Korean text; `<html lang="ko">`)

## Tech Stack

- **Framework:** Next.js 15 (App Router) with React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **Fonts:** Geist Sans + Geist Mono (Google Fonts via `next/font`)
- **State:** Client-side localStorage (no database)
- **Linting:** ESLint 9 flat config with `eslint-config-next` (core-web-vitals + typescript)
- **Testing:** None configured
- **CI/CD:** None configured
- **Deployment target:** Vercel

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (flat config)
```

Figma plugin (separate workspace):
```bash
cd figma-plugin && npm run build   # Build plugin
cd figma-plugin && npm run watch   # Watch mode
```

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Sidebar + main area)
│   ├── page.tsx                # Landing — redirects to /create
│   ├── globals.css             # CSS variables, Tailwind, dark mode, animations
│   ├── create/page.tsx         # Main generation interface
│   ├── brand/page.tsx          # Brand guidelines management
│   ├── library/page.tsx        # Asset library/gallery
│   ├── settings/page.tsx       # API keys & OAuth connections
│   └── api/
│       ├── generate/           # POST: AI asset generation
│       ├── test-key/           # API key validation
│       ├── library/            # Asset library CRUD
│       ├── figma/push/         # Push assets to Figma
│       └── auth/[provider]/callback/  # OAuth callbacks (Figma, Google, OpenAI)
├── components/
│   ├── brand/                  # GuidelineCard, GuidelineForm
│   ├── create/                 # ModelSelector, PromptInput, GenerationPreview
│   ├── layout/                 # Header, Sidebar
│   ├── library/                # AssetCard, AssetGrid
│   ├── settings/               # ProviderCard, FigmaCard
│   └── ui/                     # Reusable primitives (Button, Badge)
├── lib/
│   ├── ai-models.ts            # AI_MODELS config, STYLE_PRESETS, helpers
│   ├── brand-store.ts          # BrandProfile store (localStorage)
│   ├── asset-store.ts          # GeneratedAsset & history store (localStorage)
│   ├── settings-store.ts       # AppSettings store, OAuth URL builders, API keys
│   ├── figma-api.ts            # Figma REST API client
│   └── export-utils.ts         # Asset export utilities
├── types/
│   └── index.ts                # All shared TypeScript types
figma-plugin/                   # Standalone Figma plugin (esbuild, separate tsconfig)
```

## Key Architecture Decisions

- **No database** — all state persists in browser localStorage under keys prefixed with `simple-` (e.g., `simple-settings`, `simple-brand-profile`, `simple-assets`, `simple-key-{provider}`)
- **"use client"** directive on all interactive components; API routes handle server-side external calls
- **Demo mode** — deterministic SVG generation when no API key is configured
- **Multi-model support** — Claude (SVG), OpenAI (DALL-E/GPT-Image), Gemini (with fallback chain: gemini-2.5-flash → gemini-2.0-flash → gemini-1.5-flash)
- **Brand guidelines** injected directly into AI prompts via `buildBrandDirective()`
- **Default output:** 1024x1024 transparent PNG/SVG

## Code Conventions

- **Path alias:** `@/*` maps to `./src/*` (configured in tsconfig.json)
- **Component files:** PascalCase filenames matching component names
- **Types:** Centralized in `src/types/index.ts` — import from `@/types`
- **Stores (lib/):** Export plain functions that read/write localStorage with SSR guards (`typeof window === "undefined"`)
- **API routes:** Next.js route handlers in `src/app/api/*/route.ts`
- **Styling:** Use Tailwind utility classes with CSS custom properties defined in `globals.css`. Color tokens: `--accent`, `--muted`, `--border`, `--card-bg`, `--sidebar-bg`, etc. Dark mode via `prefers-color-scheme` media query.
- **No Prettier** — formatting relies on editor defaults and ESLint

## Environment Variables

Required for full functionality (set in `.env.local`):

```
NEXT_PUBLIC_OPENAI_CLIENT_ID    # OpenAI OAuth client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID    # Google/Gemini OAuth client ID
NEXT_PUBLIC_FIGMA_CLIENT_ID     # Figma OAuth client ID
```

Server-side equivalents are used in OAuth callback routes. The app works in demo mode without any env vars.

## Key Types

```typescript
type AIModel = "claude" | "openai" | "gemini"
type OutputFormat = "svg" | "png" | "pdf"
type GenerationStatus = "idle" | "generating" | "done" | "error"
type GuidelineCategory = "color" | "shape" | "typography" | "composition" | "mood" | "constraint" | "custom"
type ConnectionStatus = "connected" | "disconnected" | "error"
type AuthMethod = "api_key" | "oauth"
```

## Common Tasks

- **Add a new AI model:** Update `AIModel` type in `src/types/index.ts`, add config to `AI_MODELS` in `src/lib/ai-models.ts`, handle in `src/app/api/generate/route.ts`
- **Add a brand guideline category:** Update `GuidelineCategory` type and `GUIDELINE_CATEGORIES` in the brand store
- **Add a new page:** Create `src/app/{route}/page.tsx` and add nav link in `src/components/layout/Sidebar.tsx`
- **Modify theme colors:** Edit CSS custom properties in `src/app/globals.css` (both light and dark sections)
