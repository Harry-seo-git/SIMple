import { AIModel, AppSettings, AIProviderConnection, FigmaConnection, ConnectionStatus, AuthMethod } from "@/types";

const STORAGE_KEY = "simple-settings";

// ── Provider metadata ──

export const AI_PROVIDER_META: Record<AIModel, {
  name: string;
  icon: string;
  docsUrl: string;
  keyPlaceholder: string;
  keyPrefix: string;
  oauthSupported: boolean;
  oauthProvider?: string;
  oauthScopes?: string;
  oauthAuthUrl?: string;
  oauthNote?: string;
}> = {
  claude: {
    name: "Anthropic (Claude)",
    icon: "\u2728",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-api03-...",
    keyPrefix: "sk-ant-",
    oauthSupported: false,
    oauthNote: "Anthropic\uc740 \ud604\uc7ac OAuth\ub97c \uc9c0\uc6d0\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. API Key\ub85c\ub9cc \uc5f0\uacb0 \uac00\ub2a5\ud569\ub2c8\ub2e4.",
  },
  openai: {
    name: "OpenAI",
    icon: "\ud83c\udf1f",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-proj-...",
    keyPrefix: "sk-",
    oauthSupported: true,
    oauthProvider: "openai",
    oauthScopes: "openid profile email",
    oauthAuthUrl: "https://auth.openai.com/authorize",
    oauthNote: "OpenAI \uacc4\uc815\uc73c\ub85c \ub85c\uadf8\uc778\ud558\uc5ec API \uc811\uadfc \uad8c\ud55c\uc744 \ubd80\uc5ec\ud569\ub2c8\ub2e4.",
  },
  gemini: {
    name: "Google (Gemini)",
    icon: "\ud83d\udc8e",
    docsUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIzaSy...",
    keyPrefix: "AIza",
    oauthSupported: true,
    oauthProvider: "google",
    oauthScopes: "openid email profile https://www.googleapis.com/auth/generative-language",
    oauthAuthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    oauthNote: "Google \uacc4\uc815\uc73c\ub85c \ub85c\uadf8\uc778\ud558\uc5ec Gemini API \uc811\uadfc \uad8c\ud55c\uc744 \ubd80\uc5ec\ud569\ub2c8\ub2e4.",
  },
};

// ── Defaults ──

const DEFAULT_SETTINGS: AppSettings = {
  aiProviders: {
    claude: { provider: "claude", authMethod: "api_key", status: "disconnected" },
    openai: { provider: "openai", authMethod: "api_key", status: "disconnected" },
    gemini: { provider: "gemini", authMethod: "api_key", status: "disconnected" },
  },
  figma: { status: "disconnected", authMethod: "oauth" },
  defaults: {
    model: "claude",
    outputFormat: "svg",
  },
};

// ── Store functions ──

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle new fields
      return { ...DEFAULT_SETTINGS, ...parsed, aiProviders: { ...DEFAULT_SETTINGS.aiProviders, ...parsed.aiProviders } };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Mask an API key for display: show first 8 and last 4 chars
 */
export function maskApiKey(key: string): string {
  if (key.length <= 12) return "\u2022".repeat(key.length);
  return `${key.slice(0, 8)}${"\u2022".repeat(key.length - 12)}${key.slice(-4)}`;
}

/**
 * Save an API key for a provider and update connection status
 */
export function setProviderApiKey(
  settings: AppSettings,
  provider: AIModel,
  apiKey: string
): AppSettings {
  const updated: AppSettings = {
    ...settings,
    aiProviders: {
      ...settings.aiProviders,
      [provider]: {
        ...settings.aiProviders[provider],
        authMethod: "api_key" as AuthMethod,
        apiKey: maskApiKey(apiKey),
        status: "connected" as ConnectionStatus,
        lastVerified: new Date().toISOString(),
        error: undefined,
      },
    },
  };
  // Store the real key separately (server-side would use env vars in production)
  if (typeof window !== "undefined") {
    localStorage.setItem(`simple-key-${provider}`, apiKey);
  }
  saveSettings(updated);
  return updated;
}

/**
 * Set provider OAuth connection (after OAuth callback)
 */
export function setProviderOAuth(
  settings: AppSettings,
  provider: AIModel,
  oauthData: { userName?: string; email?: string }
): AppSettings {
  const updated: AppSettings = {
    ...settings,
    aiProviders: {
      ...settings.aiProviders,
      [provider]: {
        ...settings.aiProviders[provider],
        authMethod: "oauth" as AuthMethod,
        status: "connected" as ConnectionStatus,
        oauthUserName: oauthData.userName,
        oauthEmail: oauthData.email,
        lastVerified: new Date().toISOString(),
        apiKey: undefined,
        error: undefined,
      },
    },
  };
  saveSettings(updated);
  return updated;
}

/**
 * Retrieve the real (unmasked) API key for a provider
 */
export function getRealApiKey(provider: AIModel): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`simple-key-${provider}`);
}

/**
 * Disconnect a provider (remove key and OAuth data)
 */
export function disconnectProvider(
  settings: AppSettings,
  provider: AIModel
): AppSettings {
  const updated: AppSettings = {
    ...settings,
    aiProviders: {
      ...settings.aiProviders,
      [provider]: {
        provider,
        authMethod: "api_key",
        status: "disconnected",
      },
    },
  };
  if (typeof window !== "undefined") {
    localStorage.removeItem(`simple-key-${provider}`);
    localStorage.removeItem(`simple-oauth-${provider}`);
  }
  saveSettings(updated);
  return updated;
}

/**
 * Update Figma OAuth connection
 */
export function setFigmaConnection(
  settings: AppSettings,
  connection: Partial<FigmaConnection>
): AppSettings {
  const updated: AppSettings = {
    ...settings,
    figma: { ...settings.figma, ...connection },
  };
  saveSettings(updated);
  return updated;
}

/**
 * Disconnect Figma
 */
export function disconnectFigma(settings: AppSettings): AppSettings {
  const updated: AppSettings = {
    ...settings,
    figma: { status: "disconnected", authMethod: "oauth" },
  };
  if (typeof window !== "undefined") {
    localStorage.removeItem("simple-figma-token");
  }
  saveSettings(updated);
  return updated;
}

/**
 * Get count of connected providers
 */
export function getConnectedCount(settings: AppSettings): number {
  return Object.values(settings.aiProviders).filter(
    (p) => p.status === "connected"
  ).length;
}

/**
 * Build OAuth redirect URL for a provider
 */
export function buildOAuthRedirectUrl(provider: AIModel): string | null {
  const meta = AI_PROVIDER_META[provider];
  if (!meta.oauthSupported) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = `${origin}/api/auth/${meta.oauthProvider}/callback`;
  const state = crypto.randomUUID();

  if (typeof window !== "undefined") {
    sessionStorage.setItem(`oauth-state-${provider}`, state);
  }

  if (provider === "openai") {
    const clientId = process.env.NEXT_PUBLIC_OPENAI_CLIENT_ID;
    if (!clientId) return null; // Will trigger demo mode
    return `${meta.oauthAuthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(meta.oauthScopes || "")}&state=${state}&response_type=code`;
  }

  if (provider === "gemini") {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return null; // Will trigger demo mode
    return `${meta.oauthAuthUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(meta.oauthScopes || "")}&state=${state}&response_type=code&access_type=offline&prompt=consent`;
  }

  return null;
}
